import { Request, Response } from 'express';
import prisma from '../models';

export const getPhones = async (req: Request, res: Response) => {
  try {
    const { keyword, page = '1', pageSize = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = {};
    if (keyword) {
      where.phoneNumber = { contains: String(keyword) };
    }
    const [list, total] = await Promise.all([
      prisma.phone.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(pageSize),
        include: {
          benefits: {
            include: { benefit: { select: { id: true, name: true, cost: true, benefitValue: true } } },
          },
          grabRecords: { select: { month: true, status: true, grabbedAt: true } },
          express: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true } },
        },
      }),
      prisma.phone.count({ where }),
    ]);

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const enriched = list.map((phone) => {
      const totalBenefits = phone.benefits.length;
      const grabbedCount = phone.grabRecords.filter((r) => r.month === currentMonth && r.status === '已领取').length;
      const notGrabbedCount = totalBenefits - grabbedCount;
      const monthlyCost = phone.benefits.reduce((sum, pb) => sum + (pb.benefit?.cost ? Number(pb.benefit.cost) : 0), 0);
      const lastGrab = phone.grabRecords.sort((a, b) => new Date(b.grabbedAt || 0).getTime() - new Date(a.grabbedAt || 0).getTime())[0];
      const latestExpress = phone.express[0];

      return {
        id: phone.id,
        phoneNumber: phone.phoneNumber,
        status: phone.status,
        createdAt: phone.createdAt,
        totalBenefits,
        grabbedCount,
        notGrabbedCount,
        monthlyCost,
        lastGrabTime: lastGrab?.grabbedAt || null,
        expressStatus: latestExpress?.status || '无',
        benefits: phone.benefits,
      };
    });

    res.json({ code: 200, data: { list: enriched, total } });
  } catch (error) {
    console.error('获取号码列表失败:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
};

export const getPhoneDetail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const phone = await prisma.phone.findUnique({
      where: { id },
      include: {
        benefits: {
          include: {
            benefit: { select: { id: true, name: true, cost: true, benefitValue: true, needGrab: true } },
          },
        },
        grabRecords: {
          orderBy: { month: 'desc' },
          select: { benefitId: true, month: true, status: true, grabbedAt: true },
        },
      },
    });
    if (!phone) {
      return res.json({ code: 404, message: '号码不存在' });
    }
    res.json({ code: 200, data: phone });
  } catch (error) {
    console.error('获取号码详情失败:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
};

const syncPhoneBenefits = async (phoneId: number, benefitIds: number[]) => {
  await prisma.phoneBenefit.deleteMany({ where: { phoneId } });
  if (benefitIds.length > 0) {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    await prisma.phoneBenefit.createMany({
      data: benefitIds.map((benefitId) => ({
        phoneId,
        benefitId,
        grabDayStart: 1,
        grabDayEnd: lastDay,
      })),
    });
  }
};

export const createPhone = async (req: Request, res: Response) => {
  try {
    const { phoneNumber, status, benefitIds } = req.body;
    if (!phoneNumber) {
      return res.json({ code: 400, message: '手机号不能为空' });
    }
    const existing = await prisma.phone.findUnique({ where: { phoneNumber } });
    if (existing) {
      return res.json({ code: 400, message: '手机号已存在' });
    }
    const phone = await prisma.phone.create({
      data: {
        phoneNumber,
        status: status ?? 1,
      },
    });
    if (benefitIds && benefitIds.length > 0) {
      await syncPhoneBenefits(phone.id, benefitIds);
    }
    res.json({ code: 200, message: '创建成功', data: phone });
  } catch (error) {
    console.error('创建号码失败:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
};

export const updatePhone = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { phoneNumber, status, benefitIds } = req.body;
    const existing = await prisma.phone.findUnique({ where: { id } });
    if (!existing) {
      return res.json({ code: 404, message: '号码不存在' });
    }
    if (phoneNumber && phoneNumber !== existing.phoneNumber) {
      const dup = await prisma.phone.findUnique({ where: { phoneNumber } });
      if (dup) {
        return res.json({ code: 400, message: '手机号已存在' });
      }
    }
    await prisma.phone.update({
      where: { id },
      data: { phoneNumber, status },
    });
    if (benefitIds !== undefined) {
      await syncPhoneBenefits(id, benefitIds || []);
    }
    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新号码失败:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
};

export const deletePhone = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.phone.findUnique({ where: { id } });
    if (!existing) {
      return res.json({ code: 404, message: '号码不存在' });
    }
    await prisma.phoneBenefit.deleteMany({ where: { phoneId: id } });
    await prisma.grabRecord.deleteMany({ where: { phoneId: id } });
    await prisma.couponRecord.deleteMany({ where: { phoneId: id } });
    await prisma.express.deleteMany({ where: { phoneId: id } });
    await prisma.phone.delete({ where: { id } });
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除号码失败:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
};

export const ungrabBenefit = async (req: Request, res: Response) => {
  try {
    const phoneId = Number(req.params.id);
    const { benefitId } = req.body;
    if (!benefitId) {
      return res.json({ code: 400, message: '缺少权益ID' });
    }
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const existing = await prisma.grabRecord.findUnique({
      where: { phoneId_benefitId_month: { phoneId, benefitId, month } },
    });
    if (!existing || existing.status === '未领取') {
      return res.json({ code: 400, message: '该权益未领取，无法取消' });
    }
    await prisma.grabRecord.delete({
      where: { phoneId_benefitId_month: { phoneId, benefitId, month } },
    });
    res.json({ code: 200, message: '已取消领取' });
  } catch (error) {
    console.error('取消领取失败:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
};

export const grabBenefit = async (req: Request, res: Response) => {
  try {
    const phoneId = Number(req.params.id);
    const { benefitId } = req.body;
    if (!benefitId) {
      return res.json({ code: 400, message: '缺少权益ID' });
    }
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const existing = await prisma.grabRecord.findUnique({
      where: { phoneId_benefitId_month: { phoneId, benefitId, month } },
    });
    if (existing && existing.status === '已领取') {
      return res.json({ code: 400, message: '该权益本月已领取' });
    }
    await prisma.grabRecord.upsert({
      where: { phoneId_benefitId_month: { phoneId, benefitId, month } },
      update: { status: '已领取', grabbedAt: now },
      create: { phoneId, benefitId, status: '已领取', grabbedAt: now, month },
    });
    res.json({ code: 200, message: '领取成功' });
  } catch (error) {
    console.error('领取失败:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
};

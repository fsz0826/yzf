import { Request, Response } from 'express';
import prisma from '../models';

export const getAllCoupons = async (req: Request, res: Response) => {
  try {
    const { keyword, benefitId, page = '1', pageSize = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = {};
    if (keyword) {
      where.name = { contains: String(keyword) };
    }
    if (benefitId) {
      where.benefitId = Number(benefitId);
    }
    const [list, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        include: { benefit: { select: { name: true } } },
        orderBy: { sortOrder: 'asc' },
        skip,
        take: Number(pageSize),
      }),
      prisma.coupon.count({ where }),
    ]);
    res.json({ code: 200, data: { list, total } });
  } catch (error) {
    console.error('获取优惠券列表失败:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
};

export const createCoupon = async (req: Request, res: Response) => {
  try {
    const { benefitId, name, needGrab, forPhysical, validDays, validStart, validEnd, sortOrder, status } = req.body;
    if (!name) {
      return res.json({ code: 400, message: '优惠券名称不能为空' });
    }
    const coupon = await prisma.coupon.create({
      data: {
        benefitId: benefitId ?? null,
        name,
        needGrab: needGrab ?? 0,
        forPhysical: forPhysical ?? 0,
        validDays: validDays ?? null,
        validStart: validStart ? new Date(validStart) : null,
        validEnd: validEnd ? new Date(validEnd) : null,
        sortOrder: sortOrder ?? 0,
        status: status ?? 1,
      },
    });
    res.json({ code: 200, message: '创建成功', data: coupon });
  } catch (error) {
    console.error('创建优惠券失败:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { benefitId, name, needGrab, forPhysical, validDays, validStart, validEnd, sortOrder, status } = req.body;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return res.json({ code: 404, message: '优惠券不存在' });
    }
    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        benefitId: benefitId !== undefined ? benefitId : existing.benefitId,
        name,
        needGrab,
        forPhysical: forPhysical ?? 0,
        validDays: validDays ?? null,
        validStart: validStart ? new Date(validStart) : null,
        validEnd: validEnd ? new Date(validEnd) : null,
        sortOrder,
        status,
      },
    });
    res.json({ code: 200, message: '更新成功', data: coupon });
  } catch (error) {
    console.error('更新优惠券失败:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return res.json({ code: 404, message: '优惠券不存在' });
    }
    await prisma.couponRecord.deleteMany({ where: { couponId: id } });
    await prisma.coupon.delete({ where: { id } });
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除优惠券失败:', error);
    res.json({ code: 500, message: '服务器错误' });
  }
};

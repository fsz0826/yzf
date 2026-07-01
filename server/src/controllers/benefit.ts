import { Request, Response } from 'express';
import prisma from '../models';

export const getBenefits = async (req: Request, res: Response) => {
  try {
    const { keyword, page = '1', pageSize = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const where: any = {};
    if (keyword) {
      where.name = { contains: String(keyword) };
    }
    const [list, total] = await Promise.all([
      prisma.benefit.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        skip,
        take: Number(pageSize),
        include: { coupons: { orderBy: { sortOrder: 'asc' } } },
      }),
      prisma.benefit.count({ where }),
    ]);
    res.json({ code: 200, data: { list, total } });
  } catch {
    res.json({ code: 500, message: '服务器错误' });
  }
};

export const getBenefitDetail = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const benefit = await prisma.benefit.findUnique({
      where: { id },
      include: { coupons: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!benefit) {
      return res.json({ code: 404, message: '权益不存在' });
    }
    res.json({ code: 200, data: benefit });
  } catch {
    res.json({ code: 500, message: '服务器错误' });
  }
};

const syncCoupons = async (benefitId: number, couponIds: number[]) => {
  await prisma.coupon.updateMany({
    where: { benefitId },
    data: { benefitId: null },
  });
  if (couponIds.length > 0) {
    await prisma.coupon.updateMany({
      where: { id: { in: couponIds } },
      data: { benefitId },
    });
  }
};

export const createBenefit = async (req: Request, res: Response) => {
  try {
    const { name, needGrab, cost, benefitValue, recommendation, calculationMethod, sortOrder, status, couponIds } = req.body;
    if (!name) {
      return res.json({ code: 400, message: '权益名称不能为空' });
    }
    const benefit = await prisma.benefit.create({
      data: {
        name,
        needGrab: needGrab ?? 0,
        cost: cost ?? null,
        benefitValue: benefitValue ?? null,
        recommendation: recommendation ?? null,
        calculationMethod: calculationMethod ?? null,
        sortOrder: sortOrder ?? 0,
        status: status ?? 1,
      },
    });
    if (couponIds && couponIds.length > 0) {
      await syncCoupons(benefit.id, couponIds);
    }
    res.json({ code: 200, message: '创建成功', data: benefit });
  } catch {
    res.json({ code: 500, message: '服务器错误' });
  }
};

export const updateBenefit = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { name, needGrab, cost, benefitValue, recommendation, calculationMethod, sortOrder, status, couponIds } = req.body;
    const existing = await prisma.benefit.findUnique({ where: { id } });
    if (!existing) {
      return res.json({ code: 404, message: '权益不存在' });
    }
    await prisma.benefit.update({
      where: { id },
      data: {
        name,
        needGrab,
        cost,
        benefitValue,
        recommendation,
        calculationMethod,
        sortOrder,
        status,
      },
    });
    if (couponIds !== undefined) {
      await syncCoupons(id, couponIds || []);
    }
    res.json({ code: 200, message: '更新成功' });
  } catch {
    res.json({ code: 500, message: '服务器错误' });
  }
};

export const deleteBenefit = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.benefit.findUnique({ where: { id } });
    if (!existing) {
      return res.json({ code: 404, message: '权益不存在' });
    }
    await prisma.coupon.updateMany({
      where: { benefitId: id },
      data: { benefitId: null },
    });
    await prisma.benefit.delete({ where: { id } });
    res.json({ code: 200, message: '删除成功' });
  } catch {
    res.json({ code: 500, message: '服务器错误' });
  }
};

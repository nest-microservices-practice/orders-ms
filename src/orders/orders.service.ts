import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
// import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { ChangeStatusOrderDto, OrderPaginationDTO } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Orders Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Orders Service connected to database');
  }

  create(createOrderDto: CreateOrderDto) {
    return {
      service: 'Orders MS',
      createOrderDto,
    };
    // return this.order.create({
    //   data: createOrderDto,
    // });
  }

  async findAll(orderPaginationDto: OrderPaginationDTO) {
    const total = await this.order.count({
      where: {
        status: orderPaginationDto.status,
      },
    });

    const currentPage = orderPaginationDto.page;
    const perPage = orderPaginationDto.limit;

    return {
      data: await this.order.findMany({
        where: {
          status: orderPaginationDto.status,
        },
        skip: (currentPage - 1) * perPage,
        take: perPage,
      }),
      meta: {
        total,
        currentPage,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }
    return order;
  }

  async changeStatus(changeStatusOrderDto: ChangeStatusOrderDto) {
    const { id, status } = changeStatusOrderDto;
    const order = await this.order.findUnique({
      where: { id },
    });
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    if (order.status === status) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Order status is already ${status}`,
      });
    }
    return this.order.update({
      where: { id },
      data: { status },
    });
  }
}

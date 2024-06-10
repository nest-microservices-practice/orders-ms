import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
// import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeStatusOrderDto, OrderPaginationDTO } from './dto';
import { NATS_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('Orders Service');

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Orders Service connected to database');
  }

  async create(createOrderDto: CreateOrderDto) {
    try {
      const productsId = createOrderDto.items.map(
        (product) => product.productId,
      );

      const products = await firstValueFrom(
        this.client.send({ cmd: 'validate_product' }, productsId),
      );

      //2.  Calcular valores:

      const totalAmount = createOrderDto.items.reduce((acc, orderItem) => {
        const price = products.find(
          (product) => product.id === orderItem.productId,
        ).price;

        return acc + price * orderItem.quantity;
      }, 0);

      const totalItems = createOrderDto.items.reduce(
        (acc, orderItem) => acc + orderItem.quantity,
        0,
      );

      //3. Crear la orden

      const order = await this.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: products.find((product) => product.id === item.productId)
                  .price,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((item) => ({
          ...item,
          name: products.find((product) => product.id === item.productId).name,
        })),
      };
    } catch (error) {
      console.log(error);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }

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
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true,
          },
        },
      },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    const productsId = order.OrderItem.map((item) => item.productId);

    const products = await firstValueFrom(
      this.client.send({ cmd: 'validate_product' }, productsId),
    );

    return {
      ...order,
      OrderItem: order.OrderItem.map((item) => ({
        ...item,
        name: products.find((product) => product.id === item.productId).name,
      })),
    };
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

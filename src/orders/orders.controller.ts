import { Controller, NotImplementedException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    // return this.ordersService.create(createOrderDto);
    return 'order created successfully';
  }

  @MessagePattern('findAllOrders')
  findAll() {
    // return this.ordersService.findAll();
    return 'orders found';
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload() id: number) {
    // return this.ordersService.findOne(id);
    return `order with id ${id} found`;
  }

  @MessagePattern('changeOrderStatus')
  changeStatus() {
    // return this.ordersService.changeStatus();
    throw new NotImplementedException();
  }
}

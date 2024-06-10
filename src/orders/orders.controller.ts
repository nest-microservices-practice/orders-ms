import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ChangeStatusOrderDto, OrderPaginationDTO } from './dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern('createOrder')
  create(@Payload() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern('findAllOrders')
  findAll(@Payload() orderPaginationDto: OrderPaginationDTO) {
    // return orderPaginationDto;
    return this.ordersService.findAll(orderPaginationDto);
  }

  @MessagePattern('findOneOrder')
  findOne(@Payload() id: string) {
    return this.ordersService.findOne(id);
    // return `order with id ${id} found`;
  }


  @MessagePattern('changeOrderStatus')
  changeStatus(
    @Payload() changeStatusOrderDto: ChangeStatusOrderDto,
  ) {
    return this.ordersService.changeStatus(changeStatusOrderDto);
    // throw new NotImplementedException();
  }
}

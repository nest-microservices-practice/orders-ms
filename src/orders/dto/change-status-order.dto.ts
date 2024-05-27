import { IsEnum, IsUUID } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';
import { OrderStatus } from '@prisma/client';

export class ChangeStatusOrderDto {
  @IsUUID(4)
  id: string;
  @IsEnum(OrderStatusList, {
    message: `Status must be one of these: ${OrderStatusList}`,
  })
  status: OrderStatus;
}

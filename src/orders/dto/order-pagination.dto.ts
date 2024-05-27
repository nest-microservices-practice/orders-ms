import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDTO } from 'src/common';
import { OrderStatusList } from '../enum/order.enum';
import { OrderStatus } from '@prisma/client';

export class OrderPaginationDTO extends PaginationDTO {
  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: `Status must be one of these: ${OrderStatusList}`,
  })
  status: OrderStatus;
}

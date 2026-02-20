import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseIntPipe,
  ParseFloatPipe,
} from '@nestjs/common';
import { MicroserviceService, User } from './app.service';

@Controller()
export class MicroserviceController {
  constructor(private readonly microserviceService: MicroserviceService) {}

  // 基础健康检查
  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'microservice',
      timestamp: new Date().toISOString(),
    };
  }

  // 简单的问候接口
  @Get('hello')
  getHello() {
    return this.microserviceService.getHello();
  }

  // 示例接口：/hello/world
  @Get('hello/world')
  getHelloWorld() {
    return {
      message: 'Hello, World!',
      service: 'microservice',
      timestamp: new Date().toISOString(),
    };
  }

  // 带路径参数的问候接口
  @Get('hello/:name')
  getHelloName(@Param('name') name: string) {
    return this.microserviceService.sayHello(name);
  }

  // POST 问候接口
  @Post('hello')
  @HttpCode(HttpStatus.CREATED)
  postHello(@Body(ValidationPipe) body: { name: string; age?: number }) {
    return this.microserviceService.createGreeting(body.name, body.age);
  }

  // 用户管理示例 - 获取用户
  @Get('users/:id')
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.microserviceService.getUser(id);
  }

  // 用户管理示例 - 创建用户
  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body(ValidationPipe) userData: { name: string; email: string; age?: number }) {
    return this.microserviceService.createUser(userData);
  }

  // 搜索接口
  @Get('search')
  search(@Query('q') query: string, @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10) {
    return this.microserviceService.search(query, limit);
  }

  // 数学计算接口 - 加法
  @Get('calculate/add')
  add(@Query('a', ParseFloatPipe) a: number, @Query('b', ParseFloatPipe) b: number) {
    return {
      operation: 'addition',
      result: a + b,
    };
  }
}

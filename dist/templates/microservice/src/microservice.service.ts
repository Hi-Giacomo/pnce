import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

// 模拟用户数据
export interface User {
  id: number;
  name: string;
  email: string;
  age?: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MicroserviceService {
  private users: User[] = [];
  private nextUserId = 1;

  constructor() {
    // 初始化一些示例数据
    this.initializeUsers();
  }

  private initializeUsers() {
    const sampleUsers = [
      {
        id: this.nextUserId++,
        name: 'Alice Johnson',
        email: 'alice@example.com',
        age: 28,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: this.nextUserId++,
        name: 'Bob Smith',
        email: 'bob@example.com',
        age: 32,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
    ];
    
    this.users = sampleUsers;
  }

  getHello(): string {
    return 'Hello from Microservice!';
  }

  sayHello(name: string): string {
    return `Hello, ${name}!`;
  }

  createGreeting(name: string, age?: number): any {
    let greeting = `Hello, ${name}!`;
    
    if (age !== undefined) {
      if (age < 18) {
        greeting = `Hello, young ${name}!`;
      } else if (age >= 60) {
        greeting = `Hello, respected ${name}!`;
      }
    }

    return {
      greeting,
      name,
      age,
      timestamp: new Date().toISOString(),
    };
  }

  // 用户管理功能
  getUser(id: number): User | null {
    const user = this.users.find(u => u.id === id);
    if (!user) {
      throw new HttpException(`User with id ${id} not found`, HttpStatus.NOT_FOUND);
    }
    return user;
  }

  createUser(userData: { name: string; email: string; age?: number }): User {
    const existingUser = this.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new HttpException(`Email ${userData.email} already exists`, HttpStatus.CONFLICT);
    }

    const newUser: User = {
      id: this.nextUserId++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(newUser);
    return newUser;
  }

  // 搜索功能
  search(query: string, limit: number): any {
    if (!query) {
      return { users: this.users.slice(0, limit), total: this.users.length };
    }

    const results = this.users.filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);

    return {
      query,
      users: results,
      total: results.length,
      limit,
    };
  }
}

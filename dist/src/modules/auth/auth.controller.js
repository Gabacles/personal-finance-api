"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const public_decorator_1 = require("../../shared/decorators/public.decorator");
const user_dto_1 = require("../users/dto/user.dto");
const auth_service_1 = require("./auth.service");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    register(dto) {
        return this.authService.register(dto);
    }
    login(dto) {
        return this.authService.login(dto);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user and get JWT token' }),
    (0, swagger_1.ApiBody)({ type: user_dto_1.RegisterDto }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'User created and authenticated successfully.',
        schema: {
            type: 'object',
            properties: {
                accessToken: { type: 'string' },
                tokenType: { type: 'string', example: 'Bearer' },
                expiresIn: { type: 'string', example: '7d' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                    },
                },
            },
            example: {
                accessToken: '<JWT_TOKEN>',
                tokenType: 'Bearer',
                expiresIn: '7d',
                user: {
                    id: 'd80f0ef5-73ad-4dd2-8127-fe6f59f6fc7a',
                    name: 'Joao Silva',
                    email: 'joao@email.com',
                },
            },
        },
    }),
    (0, swagger_1.ApiUnprocessableEntityResponse)({
        description: 'Business rule violation (for example, duplicated email).',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 422 },
                error: { type: 'string', example: 'Business Rule Violation' },
                message: { type: 'string', example: 'A user with this email already exists' },
                code: { type: 'string', example: 'EMAIL_ALREADY_REGISTERED' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string', example: '/api/v1/auth/register' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login and get JWT token' }),
    (0, swagger_1.ApiBody)({ type: user_dto_1.LoginDto }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Authenticated successfully.',
        schema: {
            type: 'object',
            properties: {
                accessToken: { type: 'string' },
                tokenType: { type: 'string', example: 'Bearer' },
                expiresIn: { type: 'string', example: '7d' },
                user: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                    },
                },
            },
            example: {
                accessToken: '<JWT_TOKEN>',
                tokenType: 'Bearer',
                expiresIn: '7d',
                user: {
                    id: 'd80f0ef5-73ad-4dd2-8127-fe6f59f6fc7a',
                    name: 'Joao Silva',
                    email: 'joao@email.com',
                },
            },
        },
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'User was not found for the provided email.',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 404 },
                error: { type: 'string', example: 'Not Found' },
                message: { type: 'string', example: 'User not found' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string', example: '/api/v1/auth/login' },
            },
        },
    }),
    (0, swagger_1.ApiUnprocessableEntityResponse)({
        description: 'Invalid credentials.',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 422 },
                error: { type: 'string', example: 'Business Rule Violation' },
                message: { type: 'string', example: 'Invalid email or password' },
                code: { type: 'string', example: 'INVALID_CREDENTIALS' },
                timestamp: { type: 'string', format: 'date-time' },
                path: { type: 'string', example: '/api/v1/auth/login' },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map
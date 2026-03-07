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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const domain_exceptions_1 = require("../../shared/exceptions/domain.exceptions");
const users_repository_1 = require("./users.repository");
let UsersService = class UsersService {
    constructor(usersRepository) {
        this.usersRepository = usersRepository;
    }
    async findByEmail(email) {
        return this.usersRepository.findByEmail(email);
    }
    async findById(id) {
        const user = await this.usersRepository.findById(id);
        if (!user)
            throw new domain_exceptions_1.EntityNotFoundException('User', id);
        const { passwordHash: _, ...safe } = user;
        return safe;
    }
    async create(data) {
        const user = await this.usersRepository.create({
            name: data.name,
            email: data.email,
            passwordHash: data.passwordHash,
            employmentType: data.employmentType ?? client_1.EmploymentType.CLT,
        });
        const { passwordHash: _, ...safe } = user;
        return safe;
    }
    async update(id, dto) {
        const user = await this.usersRepository.update(id, {
            name: dto.name,
            employmentType: dto.employmentType,
        });
        const { passwordHash: _, ...safe } = user;
        return safe;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_repository_1.UsersRepository])
], UsersService);
//# sourceMappingURL=users.service.js.map
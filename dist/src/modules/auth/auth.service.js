"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const argon2 = __importStar(require("argon2"));
const domain_exceptions_1 = require("../../shared/exceptions/domain.exceptions");
const users_service_1 = require("../users/users.service");
const users_repository_1 = require("../users/users.repository");
let AuthService = class AuthService {
    constructor(usersService, usersRepository, jwtService) {
        this.usersService = usersService;
        this.usersRepository = usersRepository;
        this.jwtService = jwtService;
    }
    async register(dto) {
        const existing = await this.usersRepository.findByEmail(dto.email);
        if (existing) {
            throw new domain_exceptions_1.BusinessRuleException('EMAIL_ALREADY_REGISTERED', 'A user with this email already exists');
        }
        const passwordHash = await argon2.hash(dto.password);
        const user = await this.usersService.create({
            name: dto.name,
            email: dto.email,
            passwordHash,
            employmentType: dto.employmentType,
        });
        return this.buildTokenResponse(user.id, user.name, user.email);
    }
    async login(dto) {
        const user = await this.usersRepository.findByEmail(dto.email);
        if (!user) {
            throw new domain_exceptions_1.EntityNotFoundException('User');
        }
        const passwordValid = await argon2.verify(user.passwordHash, dto.password);
        if (!passwordValid) {
            throw new domain_exceptions_1.BusinessRuleException('INVALID_CREDENTIALS', 'Invalid email or password');
        }
        return this.buildTokenResponse(user.id, user.name, user.email);
    }
    buildTokenResponse(id, name, email) {
        const payload = { sub: id, email };
        const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
        return {
            accessToken: this.jwtService.sign(payload),
            tokenType: 'Bearer',
            expiresIn,
            user: { id, name, email },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        users_repository_1.UsersRepository,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
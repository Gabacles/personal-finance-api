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
exports.RecurringController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const current_user_decorator_1 = require("../../shared/decorators/current-user.decorator");
const recurring_service_1 = require("./recurring.service");
const create_recurring_dto_1 = require("./dto/create-recurring.dto");
const update_recurring_dto_1 = require("./dto/update-recurring.dto");
let RecurringController = class RecurringController {
    constructor(recurringService) {
        this.recurringService = recurringService;
    }
    create(user, dto) {
        return this.recurringService.create(user.id, dto);
    }
    findAll(user, type, isActive) {
        const isActiveParsed = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
        return this.recurringService.findAll(user.id, { type, isActive: isActiveParsed });
    }
    findOne(user, id) {
        return this.recurringService.findById(id, user.id);
    }
    update(user, id, dto) {
        return this.recurringService.update(id, user.id, dto);
    }
    activate(user, id) {
        return this.recurringService.activate(id, user.id);
    }
    deactivate(user, id) {
        return this.recurringService.deactivate(id, user.id);
    }
    remove(user, id) {
        return this.recurringService.remove(id, user.id);
    }
};
exports.RecurringController = RecurringController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create a recurring transaction template' }),
    (0, swagger_1.ApiCreatedResponse)({ description: 'Recurring transaction created successfully.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_recurring_dto_1.CreateRecurringDto]),
    __metadata("design:returntype", void 0)
], RecurringController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'List recurring transaction templates' }),
    (0, swagger_1.ApiQuery)({ name: 'type', enum: client_1.TransactionType, required: false }),
    (0, swagger_1.ApiQuery)({ name: 'isActive', type: Boolean, required: false }),
    (0, swagger_1.ApiOkResponse)({ description: 'List of recurring transaction templates.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('isActive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], RecurringController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Get a single recurring transaction template' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Recurring transaction template details.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RecurringController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update a recurring transaction template' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Recurring transaction template updated.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_recurring_dto_1.UpdateRecurringDto]),
    __metadata("design:returntype", void 0)
], RecurringController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Activate a recurring transaction template' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Recurring transaction template activated.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RecurringController.prototype, "activate", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate a recurring transaction template' }),
    (0, swagger_1.ApiOkResponse)({ description: 'Recurring transaction template deactivated.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RecurringController.prototype, "deactivate", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Soft-delete a recurring transaction template' }),
    (0, swagger_1.ApiNoContentResponse)({ description: 'Recurring transaction template deleted.' }),
    (0, swagger_1.ApiUnauthorizedResponse)({ description: 'Missing or invalid bearer token.' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RecurringController.prototype, "remove", null);
exports.RecurringController = RecurringController = __decorate([
    (0, swagger_1.ApiTags)('Recurring Transactions'),
    (0, swagger_1.ApiBearerAuth)('jwt'),
    (0, common_1.Controller)('recurring-transactions'),
    __metadata("design:paramtypes", [recurring_service_1.RecurringService])
], RecurringController);
//# sourceMappingURL=recurring.controller.js.map
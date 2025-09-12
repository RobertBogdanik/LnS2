import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getPrinters } from "unix-print";
import * as unix  from "unix-print";
import * as win from "pdf-to-printer";
import * as path from 'path';
import {platform} from 'os';
import { WinstonLogger } from 'src/config/winston.logger';

@Injectable()
export class RaportsService {
    constructor(
        private readonly configService: ConfigService,
            
        private readonly logger: WinstonLogger
    ) {}

    async getPrinters() {
        if(platform() === 'win32') {
            const printers = await win.getPrinters()
            this.logger.log(`Fetched ${printers.length} printers for Windows.`);
            return printers.map(printer => printer.name);
        } else if(platform() === 'linux') {
            const printers = await unix.getPrinters();
            this.logger.log(`Fetched ${printers.length} printers for Linux.`);
            return printers.map(printer => printer.printer);
        } else {
            this.logger.error(`Unsupported OS: ${platform()}`);
            throw new Error(`Unsupported OS: ${platform()}`);
        }
    }
    
    async print(printer: string, pathToPdf: string) {
        const basicPath = this.configService.get<string>('BASIC_PATH');
        if (!basicPath) {
            this.logger.error('BASIC_PATH is not defined in configuration.');
            throw new BadRequestException('BASIC_PATH is not defined');
        }

        const fullPath = path.join(basicPath, pathToPdf);
        this.logger.log(`Preparing to print file at ${fullPath} using printer "${printer}" on ${platform()}.`);

        if(platform() === 'win32') {
            try {
                const availablePrinters = await win.getPrinters();
                const printerNames = availablePrinters.map(p => p.name);
                if (!printerNames.includes(printer)) {
                    this.logger.error(`Printer "${printer}" does not exist`);
                    return { message: `Printer "${printer}" does not exist`, success: false };
                }
                await win.print(fullPath, {
                    printer: printer,
                });
                this.logger.log(`Print job sent to printer "${printer}" for file "${fullPath}".`);
                return { message: 'Zlecono wydrukowanie raportu.', success: true, printer, path: fullPath };
            } catch (error) {
                this.logger.error(`Failed to print: ${error.message}`);
                return { message: `Failed to print: ${error.message}`, success: false };
            }
        } else if(platform() === 'linux') {
            try {
                const availablePrinters = await unix.getPrinters();
                const printers = availablePrinters.map(p => p.printer);
                if (!printers.includes(printer)) {
                    this.logger.error(`Printer "${printer}" does not exist`);
                    throw { message: `Printer "${printer}" does not exist`, success: false };
                }
                await unix.print(fullPath, printer);
                this.logger.log(`Print job sent to printer "${printer}" for file "${fullPath}".`);
                return { message: 'Zlecono wydrukowanie raportu.', success: true, printer, path: fullPath };
            } catch (error) {
                this.logger.error(`Failed to print: ${error.message}`);
                throw { message: `Failed to print: ${error.message}`, success: false };
            }
        } else {
            this.logger.error(`Unsupported OS: ${platform()}`);
            throw { message: `Unsupported OS: ${platform()}`, success: false };
        }
    }
}

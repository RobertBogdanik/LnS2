import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getPrinters } from "unix-print";
import * as unix  from "unix-print";
import * as win from "pdf-to-printer";
import * as path from 'path';
import {platform} from 'os';

@Injectable()
export class RaportsService {
    constructor(
        private readonly configService: ConfigService
    ) {}

    async getPrinters() {
        if(platform() === 'win32') {
            const printers = await win.getPrinters()
            return printers.map(printer => printer.name);
        } else if(platform() === 'linux') {
            const printers = await unix.getPrinters();
            return printers.map(printer => printer.printer);
        } else {
            throw new Error(`Unsupported OS: ${platform()}`);
        }
    }
    
    async print(printer: string, pathToPdf: string) {
        const basicPath = this.configService.get<string>('BASIC_PATH');
        if (!basicPath) throw new Error('BASIC_PATH is not defined');
        const fullPath = path.join(basicPath, pathToPdf);

        if(platform() === 'win32') {
            try {
                const availablePrinters = await win.getPrinters();
                const printerNames = availablePrinters.map(p => p.name);
                if (!printerNames.includes(printer)) {
                    throw new Error(`Printer "${printer}" does not exist`);
                }
                await win.print(fullPath, {
                    printer: printer,
                });
                return { message: 'Zlecono wydrukowanie raportu.', success: true, printer, path: fullPath };
            } catch (error) {
                throw new Error(`Failed to print: ${error.message}`);
            }
        } else if(platform() === 'linux') {
            try {
                const availablePrinters = await unix.getPrinters();
                const printers = availablePrinters.map(p => p.printer);
                if (!printers.includes(printer)) {
                    throw new Error(`Printer "${printer}" does not exist`);
                }
                await unix.print(fullPath, printer);
                return { message: 'Zlecono wydrukowanie raportu.', success: true, printer, path: fullPath };
            } catch (error) {
                throw new Error(`Failed to print: ${error}`);
            }
        } else {
            throw new Error(`Unsupported OS: ${platform()}`);
        }
    }
}

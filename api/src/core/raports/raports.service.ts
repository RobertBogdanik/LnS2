import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getPrinters } from "unix-print";
import * as unix  from "unix-print";
import * as win from "pdf-to-printer";
import path from 'path';
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
        console.log('BASIC_PATH:', basicPath);
        const fullPath = path.join(basicPath, pathToPdf);
        console.log(`Printing ${fullPath} to printer ${printer} on ${platform()}`);

        if(platform() === 'win32') {
            try {
                await win.print(fullPath, {
                    printer: printer,
                });
                return { message: 'Zlecono wydrukowanie raportu.', success: true, printer, path: fullPath };
            } catch (error) {
                throw new Error(`Failed to print: ${error.message}`);
            }
        } else if(platform() === 'linux') {
            try {
                await unix.print(printer, fullPath);
                return { message: 'Zlecono wydrukowanie raportu.', success: true, printer, path: fullPath };
            } catch (error) {
                throw new Error(`Failed to print: ${error.message}`);
            }
        } else {
            throw new Error(`Unsupported OS: ${platform()}`);
        }
    }
}

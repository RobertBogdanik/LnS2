import { BadRequestException, Injectable } from '@nestjs/common';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import * as JsBarcode from 'jsbarcode';
import { createCanvas } from 'canvas';
import * as fs from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { PC5MarketView, Sheet, SheetPosition } from 'src/database/mssql.entity';
import { In, Repository } from 'typeorm';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';

(pdfMake as any).vfs = pdfFonts.vfs;

@Injectable()
export class PdfService {

    constructor(
        @InjectRepository(Sheet)
        private readonly sheetRepository: Repository<Sheet>,

        @InjectRepository(SheetPosition)
        private readonly sheetPositionRepository: Repository<SheetPosition>,

        @InjectRepository(PC5MarketView)
        private readonly pc5MarketViewRepository: Repository<PC5MarketView>,

        private readonly configService: ConfigService
    ) {}

    async generateBasicSheetPdf(id: number) {
        const sheet = await this.sheetRepository.findOne({ where: { id }, relations: ['author'] });
        console.log(sheet)
        if (!sheet) {
            return new BadRequestException(['Nie znaleziono arkusza o podanym ID.']);
        }

        const canvas = createCanvas(200, 100);
        JsBarcode(canvas, sheet.name, {
            width: 1,
            height: 25,
            margin: 0,
            displayValue: false
        });

        const productsToPrint:any = await this.sheetPositionRepository.find({
            where: { sheet: { id: id } }
        });
        const relatedProducts = await this.pc5MarketViewRepository.find({
            where: { TowId: In(productsToPrint.map(position => position.productId)) },
        });

        const linkedData = productsToPrint.map(position => {
            const relatedProduct = relatedProducts.find(product => product.TowId === position.productId);
            if (relatedProduct) {
                return {
                    ...position,
                    product: relatedProduct,
                }
            }   
            return {};
        }).filter(item => Object.keys(item).length > 0);

        const dataToPrint = linkedData
            .sort((a, b) => a.product.ItemName.localeCompare(b.product.ItemName))
            .map((item, index) => {
            return [
                { text: item.product.TowId, fontSize: 10, color: '#4f4f4f', alignment: 'right' },
                { text: item.product.ItemName, fontSize: 10, alignment: 'left' },
                {
                stack: [
                    { text: item.product.MainCode.replace(/\?/g, ''), bold: false, fontSize: 10 },
                    ...item.product.ExtraCodes.split(';').map(code => ({ text: code.trim().replace(/\?/g, ''), bold: false, fontSize: 10, color: '#4f4f4f' }))
                ]
                },
                { text: item.expectedQuantity?.toString(), fontSize: 10, alignment: 'right' },
                { text: '', fontSize: 10 }
            ];
            });

        const qrCodeBase64 = canvas.toDataURL('image/jpeg');

        const docDefinition: any = {
            content: [
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 'auto', 'auto', 140],
                        body: [
                            [
                                { text: 'TowID', fillColor: '#e0e0e0', fontSize: 11 },
                                { text: 'Nazwa', fillColor: '#e0e0e0', fontSize: 11 },
                                { text: 'Kody', fillColor: '#e0e0e0', fontSize: 11 },
                                { text: 'Stan', fillColor: '#e0e0e0', fontSize: 11 },
                                { text: 'Policzono', fillColor: '#e0e0e0', fontSize: 11 }
                            ],
                            ...dataToPrint
                        ],
                    },
                },
            ],
            header: (currentPage, pageCount) => {
                return [
                    { 
                        text: `${sheet.name} ${sheet.author.username}`, 
                        alignment: 'center',
                        margin: [0, 10], 
                        fontSize: 9,
                        bold: true,
                        color: '#ff0000'
                    },  
                ]
            },
            footer: (currentPage, pageCount) => {
                return [
                    {
                        image: qrCodeBase64,
                        alignment: 'left',
                        margin: [20, 0],
                    },
                    { 
                        text: `Życie jest jak pudełko czekoladek \n nigdy nie wiesz, co ci się trafi.`, 
                        alignment: 'center',
                        margin: [0, -24], 
                        fontSize: 9 
                    },  
                    {
                        text: `Strona ${currentPage} z ${pageCount}`,
                        alignment: 'right',
                        fontSize: 9, 
                        margin: [0, 10, 30, 0],
                    }
                ];
            },
            pageSize: 'A4',
            pageMargins: [50, 25, 20, 45],
            background: [
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 421,
                            x2: 50,
                            y2: 421,
                            lineWidth: 1,
                            lineColor: '#000000',
                        },
                    ],
                },
            ],
        };


        const filePath = `sheets/basic/${sheet.name}.pdf`;
        // const rootPath = `C:\\git\\LnS2\\api\\files`;
        
        const basicPath = this.configService.get<string>('BASIC_PATH');
        if (!basicPath)  throw new Error('BASIC_PATH is not defined');
        const fullPath = path.join(basicPath, filePath);
        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.getBuffer((buffer: Buffer) => {
            fs.writeFileSync(fullPath, buffer);
        });

        return filePath;
    }

    async generateKreskiSheetPdf(id: number) {
        const sheet = await this.sheetRepository.findOne({ where: { id }, relations: ['author'] });
        if (!sheet) {
            return new BadRequestException(['Nie znaleziono arkusza o podanym ID.']);
        }

        const canvas = createCanvas(200, 100);
        JsBarcode(canvas, sheet.name, {
            width: 1,
            height: 25,
            margin: 0,
            displayValue: false
        });

        const productsToPrint:any = await this.sheetPositionRepository.find({
            where: { sheet: { id: id } },
        });
        const relatedProducts = await this.pc5MarketViewRepository.find({
            where: { TowId: In(productsToPrint.map(position => position.productId)) },
        });

        const linkedData = productsToPrint.map(position => {
            const relatedProduct = relatedProducts.find(product => product.TowId === position.productId);
            if (relatedProduct) {
                return {
                    ...position,
                    product: relatedProduct,
                }
            }   
            return {};
        }).filter(item => Object.keys(item).length > 0);

        const dataToPrint = linkedData
            .sort((a, b) => a.product.ItemName.localeCompare(b.product.ItemName))
            .map((item, index) => {
            const canvas = createCanvas(200, 100);
            JsBarcode(canvas, item.product.MainCode.replace(/\?/g, ''), {
                width: 1,
                height: 15,
                margin: 5,
                displayValue: false
            });
            const qrCodeBase64 = canvas.toDataURL('image/jpeg');
            return [
                { text: item.product.TowId, fontSize: 10, color: '#4f4f4f', alignment: 'right' },
                { text: item.product.ItemName, fontSize: 10, alignment: 'left',
                    border: [false, true, false, true], },
                {
                    image: qrCodeBase64,
                    alignment: 'center',
                    border: [false, true, false, true],
                    borderColor: '#FFFFFF',
                },
                {
                    stack: [
                        { text: item.product.MainCode.replace(/\?/g, ''), bold: false, fontSize: 10 },
                        ...item.product.ExtraCodes.split(';').map(code => ({ text: code.trim().replace(/\?/g, ''), bold: false, fontSize: 10, color: '#4f4f4f' }))
                    ],
                    border: [false, true, false, true],
                },
                { text: item.expectedQuantity?.toString(), fontSize: 10, alignment: 'right' },
                { text: '', fontSize: 10 }
            ];
        });

        const qrCodeBase64 = canvas.toDataURL('image/jpeg');

        const docDefinition: any = {
            content: [
                {
                    table: {
                        headerRows: 1,
                        widths: ['auto', '*', 120, 'auto', 'auto', 60],
                        body: [
                            [
                                { text: 'TowID', fillColor: '#e0e0e0', fontSize: 11 },
                                { text: 'Nazwa', fillColor: '#e0e0e0', fontSize: 11 },
                                { text: 'Kod', fillColor: '#e0e0e0', fontSize: 11 },
                                { text: 'Kody', fillColor: '#e0e0e0', fontSize: 11 },
                                { text: 'Stan', fillColor: '#e0e0e0', fontSize: 11 },
                                { text: 'Policzono', fillColor: '#e0e0e0', fontSize: 11 }
                            ],
                            ...dataToPrint
                        ],
                    },
                },
            ],
            header: (currentPage, pageCount) => {
                return [
                    { 
                        text: `${sheet.name} ${sheet.author.username}`, 
                        alignment: 'center',
                        margin: [0, 10], 
                        fontSize: 9,
                        bold: true,
                        color: '#ff0000'
                    },  
                ]
            },
            footer: (currentPage, pageCount) => {
                return [
                    {
                        image: qrCodeBase64,
                        alignment: 'left',
                        margin: [20, 0],
                    },
                    { 
                        text: `Życie jest jak pudełko czekoladek \n nigdy nie wiesz, co ci się trafi.`, 
                        alignment: 'center',
                        margin: [0, -24], 
                        fontSize: 9 
                    },  
                    {
                        text: `Strona ${currentPage} z ${pageCount}`,
                        alignment: 'right',
                        fontSize: 9, 
                        margin: [0, 10, 30, 0],
                    }
                ];
            },
            pageSize: 'A4',
            pageMargins: [50, 25, 20, 45],
            background: [
                {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 421,
                            x2: 50,
                            y2: 421,
                            lineWidth: 1,
                            lineColor: '#000000',
                        },
                    ],
                },
            ],
        };


        const filePath = `sheets/basic/${sheet.name}_kreski.pdf`;
        // const rootPath = `C:\\git\\LnS2\\api\\files`;
        
        const basicPath = this.configService.get<string>('BASIC_PATH');
        if (!basicPath)  throw new Error('BASIC_PATH is not defined');
        const fullPath = path.join(basicPath, filePath);
        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.getBuffer((buffer: Buffer) => {
            fs.writeFileSync(fullPath, buffer);
        });

        return filePath;
    }

    async generateDynamicSheetPdf(id: number) {
        const sheet = await this.sheetRepository.findOne({ where: { id }, relations: ['author'] });

        if (!sheet) {
            throw new Error('Sheet not found');
        }

        if (!sheet.dynamic) {
            throw new Error('Sheet is not dynamic');
        }

        const canvas = createCanvas(200, 100);
        JsBarcode(canvas, sheet.name, {
            width: 2,
            height: 45,
            margin: 0,
            displayValue: true
        });
        const barcodeBase64 = canvas.toDataURL('image/png');

        
        const canvas2 = createCanvas(200, 100);
        JsBarcode(canvas2, sheet.name, {
            width: 1,
            height: 25,
            margin: 0,
            displayValue: false
        });
        const barcode2Base64 = canvas2.toDataURL('image/png');

        const docDefinition: any = {
            content: [
                {
                    columns: [
                        {
                            width: '*',
                            stack: [
                                { image: barcodeBase64, width: 120, height: 45, alignment: 'center' },
                                { text: 'Pikacz: ' + sheet.name.replace(/[0-9]/g, ''), alignment: 'left', fontSize: 10, margin: [0, 5, 0, 1] },
                                { text: new Date().toLocaleString(), alignment: 'left', fontSize: 10 },
                            ],
                            margin: [0, 0, 25, 0]
                        }, {
                            width: '*',
                            stack: [
                                 { text: 'Jestem świadomy, że liczenie dynamiczne może prowadzić do nieścisłości, ponieważ licząc wybraną półkę mogę pominąć towar znajdujący się w magazynie, dostawie lub innym miejscu. Jeżeli przypadkowo szczytami kod który nie był liczony muszę ten towar policzyć na gotowo.', alignment: 'left', fontSize: 8 },
                            ]
                        }, {
                            width: '225',
                            stack: [
                                { text: sheet.author.username, alignment: 'left', fontSize: 11, bold: true },
                                { text: 'Podpis: __________________________________', alignment: 'left', fontSize: 10, margin: [0, 50, 0, 0] },
                            ],
                            margin: [25, 0, 0, 0]
                        }
                    ], 
                }, {
                    text: 'Pamiętaj możesz mieć tylko jeden aktywny arkusz dynamiczny.',
                    alignment: 'center',
                    fontSize: 14,
                    bold: true,
                    color: '#ff0000',
                    margin: [0, 10, 0, 0]
                }, {
                    canvas: [
                        {
                            type: 'line',
                            x1: 0,
                            y1: 0,
                            x2: 600,
                            y2: 0,
                            lineWidth: 1,
                            lineColor: '#000000',
                        },
                    ],
                    margin: [0, 8, 0, 0]
                }, {
                    text: 'Co liczysz (opisowo):',
                    alignment: 'left',
                    fontSize: 12,
                    bold: true,
                    margin: [0, 5, 0, 0]
                }
            ],
            header: (currentPage, pageCount) => {
                return [
                    { 
                        text: `Arkusz dynamiczny`, 
                        alignment: 'center',
                        margin: [0, 10], 
                        fontSize: 9,
                        bold: true,
                        color: '#0000ff'
                    },  
                ]
            },
            footer: (currentPage, pageCount) => {
            return [
                {
                image: barcode2Base64,
                alignment: 'left',
                margin: [20, 0],
                },
                { 
                text: `Życie jest jak pudełko czekoladek \n nigdy nie wiesz, co ci się trafi.`, 
                alignment: 'center',
                margin: [0, -24], 
                fontSize: 9 
                },  
                {
                text: `Strona ${currentPage} z ${pageCount}`,
                alignment: 'right',
                fontSize: 9, 
                margin: [0, 10, 30, 0],
                }
            ];
            },
            pageSize: 'A4',
            pageMargins: [50, 25, 20, 45],
            background: [
            {
                canvas: [
                {
                    type: 'line',
                    x1: 0,
                    y1: 421,
                    x2: 50,
                    y2: 421,
                    lineWidth: 1,
                    lineColor: '#000000',
                },
                ],
            },
            ],
        };

        const filePath = `sheets/dynamic/${sheet.name}_dynamic.pdf`;
        
        const basicPath = this.configService.get<string>('BASIC_PATH');
        if (!basicPath)  throw new Error('BASIC_PATH is not defined');

        const fullPath = path.join(basicPath, filePath);
        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.getBuffer((buffer: Buffer) => {
            fs.writeFileSync(fullPath, buffer);
        });

        return filePath;
    }
}

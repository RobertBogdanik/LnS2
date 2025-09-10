import { Type } from 'class-transformer';
import { IsUUID, Length, IsDate, IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Numer karty nie może być pusty.' })
  @Length(13, 13, { message: 'Numer karty musi zawierać dokładnie 13 znaków.' })
  cardNumber: string;

  @Type(() => Date)
  @IsNotEmpty({ message: 'lastUpdate nie może być puste.' })
  @IsDate({ message: 'lastUpdate musi być poprawną datą.' })
  lastUpdate: Date;

  @IsString()
  @IsNotEmpty({ message: 'workstation nie może być puste.' })
  workstation: string;
}


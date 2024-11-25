export function DateToSqlString(date: Date): string {
    console.log(date.toUTCString());
    return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`
}

export function SqlDateTimeToDate(datetime: string): Date {
    //mysql example: 2023-09-17 00:00:00
    datetime.trim();
    datetime.replace(' ', 'T');
    datetime.concat('.000Z')
    console.log(datetime);
    return new Date(datetime);
}
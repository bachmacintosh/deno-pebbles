export default function reviveJson(_key: string, value: unknown): unknown {
	const datePattern = /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/u;
	if (typeof value === "string" && datePattern.exec(value) !== null) {
		return new Date(value);
	} else {
		return value;
	}
}

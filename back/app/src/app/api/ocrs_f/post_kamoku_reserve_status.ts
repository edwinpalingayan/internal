"use strict";
import { Request } from "express";
import { TYPES } from "tedious";
import { format } from 'date-fns';
import { z } from "zod";
import { RES_STS } from "../../../common/const";
import { ExecResults } from "../../../common/types";
import { sqlExecutor } from "../../../common/sqlExecutor"
import { validateZodKeys } from "../../../common/validation";

export const MYPAGE_URL = process.env[`MYPAGE_URL_${process.env.ENV}`]!;
const SF_API_ENDPOINT = MYPAGE_URL + "/api/ext/v1/updateKamokuReserveStatus";
const YOYAKU_MOSHIKOMI_KUBUN_GMS = "02";

// SQL
const SQL_TEMPLATE = `
USE EVENTDB

SELECT TOP(1)
	[YUBIN_NO],
	[JYUSYO],
	[TEL_NO],
	(
		SELECT
			[YOYAKU_KIGEN]
		FROM
			[dbo].[TT_EVENT]
		WHERE
			[EVENT_ID] = @EVENT_ID
	) AS [YOYAKUKIJITSU]
FROM
	[dbo].[TT_YOYAKU_MOSHIKOMI]
WHERE
	[GMS_KOKYAKU_ID] = @GMS_KOKYAKU_ID
	AND
	[EVENT_ID] = @EVENT_ID
;`;

const zReqParamSchema = z
	.object({
		gmsKokyakuId: z.string().regex(/^\d{10}$/).length(10),
		eventCd: z.string().length(12),
	})
	.strict();

export async function post_kamoku_reserve_status(req: Request): Promise<ExecResults> {

	// リクエストパラメータバリデーション
	const validationResult = zReqParamSchema.safeParse(req.body);
	const validationError = await validateZodKeys(validationResult);

	if (validationError) {
		return [RES_STS.BAD_REQUEST, "error", 1, validationError];
	}

	const validatedBody = validationResult.data;
	const [resultStatus, _, __, resultArray] = await sqlExecutor(
		post_kamoku_reserve_status.name,
		SQL_TEMPLATE,
		[
			{
				name: "EVENT_ID",
				type: TYPES.VarChar,
				value: validatedBody?.eventCd ?? null
			},
			{
				name: "GMS_KOKYAKU_ID",
				type: TYPES.VarChar,
				value: validatedBody?.gmsKokyakuId ?? null
			}
		]
	);

	if (resultStatus !== RES_STS.OK || resultArray.length === 0) {
		return [RES_STS.BAD_REQUEST, "error", 1, resultArray];
	}
	const result = resultArray[0];

	const requestBody = {
		gmsKokyakuId: validatedBody?.gmsKokyakuId,
		eventCd: validatedBody?.eventCd,
		yoyakuMoshikomiKbn: YOYAKU_MOSHIKOMI_KUBUN_GMS,
		yoyakuKijitsu: format(result['YOYAKUKIJITSU'], 'yyyy-MM-dd'),
		...(result['YUBIN_NO'] && { syosekiSoufusakiYubinNo: result['YUBIN_NO'] }),
		...(result['JYUSYO'] && { syosekiSoufusakiJusyo: result['JYUSYO'] }),
		...(result['TEL_NO'] && { syosekiSoufusakiTelNo: result['TEL_NO'] }),
	};
	console.error("requestBody:", requestBody);

	const fetchResponse = await fetch(SF_API_ENDPOINT, {
		method: "POST",
		headers: {
			"authorizationkey": "GLOBIS_REST_HANDLER",
			"Content-Type": "application/json",
			"Charset": "UTF-8"
		},
		body: JSON.stringify(requestBody),
	});

	const apiResponse = await fetchResponse.json();

	if (!fetchResponse.ok) {
		console.error("SF_API Error Response:", apiResponse);
		return [RES_STS.BAD_REQUEST, "error", 1, [apiResponse]];
	}

	console.log("SF_API Success Response:", apiResponse);

	return [RES_STS.OK, post_kamoku_reserve_status.name, 0, [apiResponse]];
}
import { EmptyRequest, StringArray } from "@/shared/proto/minicline/common";
import { Controller } from "..";
import axios from "axios";

export async function listModels(_controller: Controller, request: EmptyRequest): Promise<StringArray> {
	try {
		const baseUrl = "http://localhost:11434";

		if (!URL.canParse(baseUrl)) {
			return StringArray.create({ values: [] });
		}

		const response = await axios.get(`${baseUrl}/api/tags`);
		const modelsArray = response.data?.models?.map((model: any) => model.name) || [];
		const models = [...new Set<string>(modelsArray)].sort();

		return StringArray.create({ values: models });
	} catch (_error) {
		return StringArray.create({ values: [] });
	}
}
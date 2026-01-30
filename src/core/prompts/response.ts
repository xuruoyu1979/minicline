export const formatResponse = {
    noToolsUsed: (usingNativeToolCalls: boolean) =>
        usingNativeToolCalls
            ? "[ERROR] You did not use a tool in your previous response! Please retry with a tool use."
            : `[ERROR] You did not use a tool in your previous response! Please retry with a tool use.

${toolUseInstructionsReminder}

# Next Steps

If you have completed the user's task, use the attempt_completion tool. 
If you require additional information from the user, use the ask_followup_question tool. 
Otherwise, if you have not completed the task and do not need additional information, then proceed with the next step of the task. 
(This is an automated message, so do not respond to it conversationally.)`,

	fileEditWithoutUserChanges: (
		relPath: string | undefined,
		finalContent: string | undefined,
	) =>
		`The content was successfully saved to ${relPath}.\n\n` +
		`Here is the full, updated content of the file that was saved:\n\n` +
		`<final_file_content path="${relPath}">\n${finalContent}\n</final_file_content>\n\n` +
		`IMPORTANT: For any future changes to this file, use the final_file_content shown above as your reference. This content reflects the current state of the file, including any auto-formatting (e.g., if you used single quotes but the formatter converted them to double quotes). Always base your SEARCH/REPLACE operations on this final version to ensure accuracy.\n\n`,
};

const toolUseInstructionsReminder = `# Reminder: Instructions for Tool Use
Tool uses are formatted using XML-style tags. The tool name is enclosed in opening and closing tags, and each parameter is similarly enclosed within its own set of tags. Here's the structure:
<tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</tool_name>
For example:
<attempt_completion>
<result>
I have completed the task...
</result>
</attempt_completion>
Always adhere to this format for all tool uses to ensure proper parsing and execution.`;
/* eslint-disable @typescript-eslint/naming-convention */
// For when recommending but not requiring a list
const listInstructionsRecommended = `
1. Include a todo list using the task_progress parameter in your next tool call
2. Create a comprehensive checklist of all steps needed
3. Use markdown format: - [ ] for incomplete, - [x] for complete

**Benefits of creating a todo/task_progress list now:**
	- Clear roadmap for implementation
	- Progress tracking throughout the task
	- Nothing gets forgotten or missed
	- Users can see, monitor, and edit the plan

**Example structure:**\`\`\`
- [ ] Analyze requirements
- [ ] Set up necessary files
- [ ] Implement main functionality
- [ ] Handle edge cases
- [ ] Test the implementation
- [ ] Verify results\`\`\`

Keeping the task_progress list updated helps track progress and ensures nothing is missed.`;

const recommended = `
# task_progress RECOMMENDED

When starting a new task, it is recommended to include a todo list using the task_progress parameter.

${listInstructionsRecommended}
`;

export const FocusChainPrompts = {
	recommended,
};
import '../src/config/env.ts';
import { runMainAgent } from '../src/agents/mainAgent.ts';
import { processActions } from '../src/services/actionProcessor.ts';
/**
 * Runs an integration test of the main agent flow using a preset user message, logs the agent decision, and processes actions while logging each sub-agent event.
 *
 * This function constructs a single user message requesting WordPress plugin leads, invokes the main agent to obtain a decision, prints the decision, and then processes the decision's actions while printing each resulting sub-agent event.
 */
async function main() {
    const messages = [
        { role: 'user', content: 'Find 2 WordPress plugin leads from r/forhire with e-commerce focus.' }
    ];
    const decision = await runMainAgent(messages);
    console.log('Main decision', JSON.stringify(decision, null, 2));
    await processActions(decision.actions, (event) => {
        console.log('Sub-agent event', JSON.stringify(event, null, 2));
    });
}
main().catch((error) => {
    console.error('Test run failed', error);
    if (error && typeof error === 'object') {
        console.error('Error keys', Object.keys(error));
    }
    process.exit(1);
});
//# sourceMappingURL=test-subagent.js.map
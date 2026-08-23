import test from "node:test";
import assert from "node:assert/strict";
import { OpenAiSseAccumulator } from "../supabase/functions/_shared/openai-stream.ts";

test("reassembles text split across arbitrary transport chunks", () => {
  const accumulator = new OpenAiSseAccumulator();
  accumulator.push('data: {"choices":[{"delta":{"content":"Hel');
  accumulator.push('lo"}}]}\n\ndata: {"choices":[{"delta":{"content":" world"}}]}\n\n');
  accumulator.push("data: [DONE]\n\n");
  accumulator.finish();

  assert.equal(accumulator.text, "Hello world");
});

test("reassembles streamed function-call arguments", () => {
  const accumulator = new OpenAiSseAccumulator();
  accumulator.push('data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"name":"update_","arguments":"{\\"phase\\":\\"reg"}}]}}]}\n');
  accumulator.push('data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"name":"phase","arguments":"ister\\",\\"completed_phase\\":\\"plan\\"}"}}]}}]}\n\n');
  accumulator.finish();

  assert.deepEqual(accumulator.completedToolCalls, [{
    name: "update_phase",
    arguments: '{"phase":"register","completed_phase":"plan"}',
  }]);
});

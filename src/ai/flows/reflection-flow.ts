'use server';
/**
 * @fileOverview Provides an AI-powered reflection on a user's journal entry.
 *
 * - getReflection - A function that calls the AI flow to get a reflection.
 * - ReflectionInput - The input type for the getReflection function.
 * - ReflectionOutput - The return type for the getReflection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReflectionInputSchema = z.object({
  entry: z.string().describe('The user\'s journal entry text.'),
});
export type ReflectionInput = z.infer<typeof ReflectionInputSchema>;

const ReflectionOutputSchema = z.object({
    reflection: z.string().describe("A short, gentle, and thoughtful reflection on the user's journal entry. It can be an encouraging statement or a clarifying question. It should not be more than 2 sentences."),
});
export type ReflectionOutput = z.infer<typeof ReflectionOutputSchema>;

export async function getReflection(
  input: ReflectionInput
): Promise<ReflectionOutput> {
  return reflectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reflectionPrompt',
  input: {schema: ReflectionInputSchema},
  output: {schema: ReflectionOutputSchema},
  prompt: `You are a compassionate and insightful journaling companion. Your role is to provide a brief, gentle, and encouraging reflection on a user's journal entry.

You can either provide a warm, affirming statement or ask a soft, open-ended question that encourages deeper thought. Your response should feel like a supportive friend listening without judgment.

Keep your reflection to one or two sentences. Do not give advice.

Journal Entry:
"{{{entry}}}"`,
});

const reflectionFlow = ai.defineFlow(
  {
    name: 'reflectionFlow',
    inputSchema: ReflectionInputSchema,
    outputSchema: ReflectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

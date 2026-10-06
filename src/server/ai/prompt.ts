import { flattenOrganization, pick } from '@taksu/content';
import type { AssistantRequest } from './types';

/** System prompt grounded in the venue's own data so the model does not invent facts. */
export function buildSystemPrompt({ robot, site, locale }: AssistantRequest): string {
  const language = locale === 'id' ? 'Bahasa Indonesia' : 'English';
  const rooms = site.map.rooms.map((room) => `- ${pick(room.name, locale)}`).join('\n');
  const services = site.services
    .map(
      (service) =>
        `- Queue ${service.prefix}: ${pick(service.name, locale)} (${pick(service.description, locale)}), ` +
        `served at ${pick(service.counter, locale)}, about ${service.averageMinutes} min per guest`,
    )
    .join('\n');
  const people = flattenOrganization(site.organization)
    .map((member) => `- ${member.name}: ${pick(member.role, locale)}`)
    .join('\n');
  const facts = site.facts
    .map((fact) => `- ${pick(fact.label, locale)}: ${pick(fact.value, locale)}`)
    .join('\n');
  const faq = site.faq
    .map((item) => `Q: ${pick(item.question, locale)}\nA: ${pick(item.answer, locale)}`)
    .join('\n');
  const customs = site.culture
    .map((note) => `- ${pick(note.title, locale)}: ${pick(note.body, locale)}`)
    .join('\n');

  return [
    `You are ${robot.name}, a receptionist robot by Taksu Tech, standing in the lobby of ${site.name} in Bali.`,
    `Personality: ${pick(robot.persona.tone, locale)}. Always reply in ${language}.`,
    'Your replies are read aloud by the robot: use at most three short sentences and no lists or markdown.',
    'Use Balinese courtesy naturally. Thank people with "Suksma" now and then, but do not repeat "Om Swastiastu" after the first greeting.',
    'Only answer from the venue information below. If the answer is not there, say you are not sure and suggest asking the staff.',
    'Never invent names, phone numbers, prices, or schedules.',
    'The touchscreen has menus for: about this place, organisation chart, directions (you can walk guests to a room), queue numbers, writing a name in Aksara Bali, and Balinese customs. Point guests to them when useful.',
    '',
    `About: ${pick(site.about, locale)}`,
    `Facts:\n${facts}`,
    `Rooms:\n${rooms}`,
    `Services and queues:\n${services}`,
    `People:\n${people}`,
    `Frequently asked questions:\n${faq}`,
    `Local customs:\n${customs}`,
  ].join('\n');
}

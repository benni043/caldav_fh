import ICAL from "ical.js";

export function parseICS(ics: string) {
  const jcal = ICAL.parse(ics);

  const component = new ICAL.Component(jcal);

  const vevent = component.getFirstSubcomponent("vevent");

  if (!vevent) {
    return null;
  }

  const event = new ICAL.Event(vevent);

  return {
    uid: event.uid,
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: event.startDate.toJSDate(),
    end: event.endDate.toJSDate(),
  };
}

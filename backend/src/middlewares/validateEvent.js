import { eventCreateSchema } from '../schema/event-create.js';

export const validateEvent = (req, res, next) => {
  const { title, startDate, endDate, startTime, endTime, allDay } = req.body;
  const result = eventCreateSchema.safeParse({
    title,
    startDate,
    endDate,
    startTime,
    endTime,
    allDay,
  });
  if (!result.success) {
    return res.status(400).json({ errors: result.error.errors });
  }
  next();
};

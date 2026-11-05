/**
 * A save problem that belongs to one field. The admin's save route answers
 * with the field's name, so the form shows the message next to it and keeps
 * everything else that was typed.
 */
export class FieldError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message)
  }
}

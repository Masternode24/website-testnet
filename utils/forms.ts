// naive validators
export const UNSET = ''
export const validateEmail = (x: string) => {
  const dot = x.indexOf('.')
  return x.indexOf('@') > 0 && dot > 0 && dot !== x.length - 1
}
export const exists = (x: string) => x.trim().length > 0
export const defaultErrorText = `This field is required`
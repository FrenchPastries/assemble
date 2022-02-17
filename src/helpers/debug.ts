export const map = <Type>(elem: Type): Type => {
  console.log(elem)
  return elem
}

export const log = (elem: any): void => {
  if (process.env.SERVER_ENV === 'development') {
    console.log(elem)
  }
}

export const debugMap = <Type>(elem: Type): Type => {
  console.log(elem)
  return elem
}

export const debug = (elem: any): void => {
  if (process.env.SERVER_ENV === 'development') {
    console.log(elem)
  }
}

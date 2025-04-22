export default function replaceSubstring(str : string, n : number, m : number , t : string) : string {
  return str.substring(0, n) + t + str.substring(m);
}

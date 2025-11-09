declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const ScrollView: any;
  export const TextInput: any;
  export const Button: any;
  export const Pressable: any;
  export const Switch: any;
  export const StyleSheet: { create<T extends Record<string, any>>(styles: T): T };
}

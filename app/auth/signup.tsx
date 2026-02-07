import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { signUpEmail } from '@/api/authApi';
import axios from 'axios';

const signup = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: signUpEmail,
    onSuccess: () => {
      router.push({ pathname: "/auth/otp", params: { email } })
    },
    onError: (error) => {
      console.log("error", error);

    }
  })

  const handleSignUp = () => {
    mutation.mutate({ email, password, name })
  }
  return (
    <SafeAreaView className='flex-1 bg-black'>
      <KeyboardAvoidingView behavior={Platform.OS == "ios" ? "padding" : undefined}>
        <View className='px-6 pt-8 items-center mb-10'>
          <Text className='text-white text-2xl font-bold mt-4 text-center'>Create your account</Text>
          <Text className='text-gray-400 mt-2'>Sign up with email to continue</Text>
        </View>


        <View className='bg-[#0f0f10] rounded-t-3xl px-5 py-6'>
          <TextInput value={name} onChangeText={setName} placeholder='Full Name' placeholderTextColor={"#6b6b6b"} className='bg-[#111] border border-gray-800 px-4 py-3 text-white mb-4' autoCapitalize='words' />
          <TextInput value={email} onChangeText={setEmail} placeholder='Email' placeholderTextColor={"#6b6b6b"} keyboardType='email-address' className='bg-[#111] border border-gray-800 px-4 py-3 text-white mb-4' autoCapitalize='none' />

          <TextInput value={password} onChangeText={setPassword} placeholder='Password' placeholderTextColor={"#6b6b6b"} secureTextEntry className='bg-[#111] border border-gray-800 px-4 py-3 text-white mb-4' />
          <Pressable onPress={handleSignUp} className='bg-white rounded-full py-3 items-center mb-2'>
            <Text className='text-black font-semibold'>Create Account</Text>
          </Pressable>

          <View className='flex-row justify-center mt-4 pb-2'>
            <Text className='text-gray-400 mr-2'>Already have an account</Text>
            <Pressable onPressIn={() => router.back()}>
              <Text className='text-white font-semibold'>Log In</Text>
            </Pressable>
          </View>



          {mutation.isError && (
  <Text className="text-red-500 text-center px-4 mt-4">
    {axios.isAxiosError(mutation.error)
      ? mutation.error.response?.data?.error ||
        `Server error ${mutation.error.response?.status}`
      : "Network error"}
  </Text>
)}


        </View>

      </KeyboardAvoidingView>

    </SafeAreaView>
  )
}

export default signup

const styles = StyleSheet.create({})
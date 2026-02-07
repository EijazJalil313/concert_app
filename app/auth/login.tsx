import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const login = () => {
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")
    const router = useRouter();
  return (
    <SafeAreaView className='flex-1 bg-black'>
        <KeyboardAvoidingView behavior={Platform.OS == "ios" ? "padding" : undefined}>
            <View className='px-6 pt-8 items-center'>
                <Text className='text-white text-xl font-bold mt-4 text-center'>One app for your concert plans</Text>
                <Text className='text-yellow-300 font-semibold mt-2'>Concerts . Dining . Events</Text>
            </View>


            <View className='bg-[#0f0f10] rounded-t-3xl px-5 py-6 mt-20'>
                <Text className='text-white text-2xl font-semibold mb-4 text-center'>Log in or sign up</Text>
                <View>
                    <TextInput value={email} onChangeText={setEmail} placeholder='Email' placeholderTextColor={"#6b6b6b"} keyboardType='email-address' className='bg-[#111] border border-gray-800 px-4 py-3 text-white mb-4' autoCapitalize='none' />
                    <TextInput value={password} onChangeText={setPassword} placeholder='Password' placeholderTextColor={"#6b6b6b"} secureTextEntry className='bg-[#111] border border-gray-800 px-4 py-3 text-white mb-4'/>

                    <Pressable className='bg-white rounded-full py-3 items-center mb-2'>
                        <Text className='text-black font-semibold'>Continue</Text>
                    </Pressable>

                    <View className='flex-row items-center justify-center space-x-3 mt-2 mb-3'>

                        <View className='h-[1px] bg-gray-800 flex-1' />
                        <Text className='text-gray-400 uppercase text-xs'>or</Text>
                        <View className='h-[1px] bg-gray-800 flex-1' />
                        <View  />


                    </View>
                        <Pressable className='bg-white rounded-xl py-3 px-4 flex-row items-center justify-center mb-2'>
                            <Image source={{uri:"https://media.istockphoto.com/id/2228661068/photo/isolated-google-logo-symbolizing-internet-search-and-technology.jpg?s=1024x1024&w=is&k=20&c=4OIs0KcYK8K9uk7BFJp4YcmxkuWrAjXYo6io4vuu7B0="}} style={{width:20,height:20,marginRight:10}} resizeMode='cover' />
                            <Text className='text-black font-semibold'>
                                Continue with Google
                            </Text>
                        </Pressable>

                        <View className='flex-row justify-center mt-4 pb-2'>
                            <Text className='text-gray-400 mr-2'>Don't have an account</Text>
                            <Pressable onPressIn={()=> router.push("/auth/signup")}>
                                <Text className='text-white font-semibold'>Sign Up</Text>
                            </Pressable>
                        </View>
                </View>
            </View>

        </KeyboardAvoidingView>

    </SafeAreaView>
  )
}

export default login

const styles = StyleSheet.create({})
import { Pressable, StyleSheet, Text, View, ActivityIndicator, ScrollView, Image } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { getConfirmedBooking } from '@/api/bookingApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ConfirmedBooking {
  id:string,
  seats:number,
  category:{
    id:string,
    name:string,
    price:number,
  },

  concert:{
    id:number,
    name:string,
    venue:string,
    date:number,
    imageUrl:string,
  }
}

export default function ConfirmationScreen () {
  const router = useRouter();
  const {bookingId} = useLocalSearchParams<{ bookingId: string}>();
  const [booking,setBooking] = useState<ConfirmedBooking | null>(null);
  const [loading,setLoading] = useState(true);


  useEffect(()=>{
    if(!bookingId){
      router.back();
    };


    const fetchBooking = async() => {
      try{
        const data = await getConfirmedBooking(bookingId);
        setBooking(data);
      }catch(err){
        console.error("Failed to fetch confirmed booking",err);
      }
      finally {
        setLoading(false);
      }
    };

    fetchBooking();
  },[bookingId]);

  console.log("data",booking);
  if (loading) {
    return (
      <SafeAreaView className='flex-1 bg-black items-center justify-center'>
        <ActivityIndicator size='large' color={'#fff'} />
      </SafeAreaView>
    );
  }

  if (!booking) {
    return (
      <SafeAreaView className='flex-1 bg-black items-center justify-center'>
        <Text className='text-white'>Booking not found.</Text>
        <Pressable className='mt-4 p-2' onPress={() => router.back()}>
          <Text className='text-blue-400'>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const { concert, category, seats } = booking;

  const total = (seats ?? 0) * (category?.price ?? 0);

  const formattedDate = concert?.date
    ? new Date(concert.date).toLocaleString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      })
    : '';


return(
  <SafeAreaView className='flex-1 bg-black'>
    <View className='px-4 pt-3 pb-2'>
      <View className='flex-row items-center justify-between'>
        <Pressable className='p-2 rounded-full' onPress={()=>router.back()}>
          <Ionicons name='arrow-back' size={22} color={"#fff"}/>
        </Pressable>
        <Text className='text-white text-lg font-semibold'>
          Booking Confirmed
        </Text>
        <View className='w-8' />
      </View>
    </View>


    <ScrollView className="flex-1 px-4">
  <View className="bg-green-600 rounded-2xl px-6 py-4 items-center mb-6">
    <Ionicons name="checkmark-circle" size={48} color="#fff" />

    <Text className="text-white text-xl font-bold mt-2">
      Tickets Secured
    </Text>

    <Text className="text-green-100 text-center mt-1">
      Your booking is confirmed. Check your email for details.
    </Text>
  </View>


  <View className='bg-[#111] rounded-2xl px-4 py-4 mb-6 overflow-hidden'>
    <Image className='w-full h-48 rounded-xl mb-4' source={{uri:concert?.imageUrl}} />
    <Text className='text-white text-xl font-bold mb-2'>{concert?.name}</Text>
    <Text className='text-gray-300'>{formattedDate}</Text>
  </View>

  <View className="rounded-2xl px-6 py-6 mb-6 items-center bg-green-600">
  
  <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mb-3">
    <Ionicons name="ticket" size={24} color="#fff" />
  </View>

  <Text className="text-white text-lg font-bold mb-1">
    {seats} x {category?.name?.toUpperCase()}
  </Text>

  <Text className="text-white/80 mb-4">
    ₨ {category?.price?.toLocaleString()} each
  </Text>

  <View className="bg-white/10 rounded-lg px-4 py-2">
    <Text className="text-white text-sm font-medium">
      Booking ID: {booking?.id?.slice(-8)}
    </Text>
  </View>

</View>


<View className='bg-[#111] rounded-2xl px-4 py-4 mb-6'>
  <Text className="text-white font-semibold mb-3">Payment Summary</Text>

  <View className="flex-row justify-between mb-2">
    <Text className="text-gray-300">Tickets ({seats})</Text>
<Text className="text-white">{total.toLocaleString()}</Text>

  </View>


  <View className='flex-row justify-between mb-4'>
    <Text className='text-gray-300'>Booking Fee</Text>
    <Text className='text-white'>Included</Text>
  </View>

  <View className="flex-row justify-between">
  <Text className="text-white font-bold">Total Paid</Text>

  <Text className="text-white font-bold">
    ₨ {total.toLocaleString()}
  </Text>
</View>

</View>

<View className="bg-[#111] rounded-2xl px-4 py-4 mb-6">
  <Text className="text-white font-semibold mb-3">Payment Summary</Text>

  <View className="flex-row justify-between mb-2">
    <Text className="text-gray-300">Tickets ({seats})</Text>
    <Text className="text-white">₨ {total.toLocaleString()}</Text>
  </View>

  <View className="flex-row justify-between mb-4">
    <Text className="text-gray-300">Booking Fee</Text>
    <Text className="text-white">Included</Text>
  </View>

  <View className="flex-row justify-between">
    <Text className="text-white font-bold">Total Paid</Text>
    <Text className="text-white font-bold">
      ₨ {total.toLocaleString()}
    </Text>
  </View>
</View>



<View className="bg-[#111] rounded-2xl px-4 py-4">
  <Text className="text-white font-semibold mb-3">What's Next?</Text>

  <View className="space-y-3">

    {/* Step 1 */}
    <View className="flex-row items-center">
      <View className="w-2 h-2 bg-green-500 rounded-full mr-3" />
      <Text className="text-gray-300 flex-1">
        Check your email for confirmation
      </Text>
    </View>

    {/* Step 2 */}
    <View className="flex-row items-center">
      <View className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
      <Text className="text-gray-300 flex-1">
        Arrive early to avoid queues
      </Text>
    </View>

    {/* Step 3 */}
    <View className="flex-row items-center">
      <View className="w-2 h-2 bg-purple-500 rounded-full mr-3" />
      <Text className="text-gray-300 flex-1">
        Download tickets to wallet
      </Text>
    </View>

  </View>
</View>


</ScrollView>

<View className="absolute bottom-0 left-8 right-8 bg-black border-t border-gray-800 p-4">
  <Pressable className="bg-blue-600 px-6 py-4 rounded-full items-center">
    <Text className="text-white font-bold text-lg">
      Book More Tickets
    </Text>
  </Pressable>
</View>

  </SafeAreaView>
)

}


const styles = StyleSheet.create({})
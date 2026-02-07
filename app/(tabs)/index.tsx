import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { getConcert } from '@/api/concertApi';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';


export default function ConcertScreen() {
  const router = useRouter();

  const { data: concert, isLoading, error } = useQuery({
    queryKey: ["concert"],
    queryFn: getConcert,

  });

  console.log("data", concert)

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-black justify-center items-center'>
        <ActivityIndicator size={"large"} color={"#fff"} />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView className='flex-1 bg-black justify-center items-center'>
        <Text className='text-red-500'>Error loading message : {error?.message}</Text>
      </SafeAreaView>
    )
  }

  const minprice = Math.min(...concert.categories?.map((cat: { price: number }) => cat.price));
  console.log(minprice)
  const formattedDate = new Date(concert.date).toLocaleString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  })

  const formattedTime = new Date(concert.date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).toUpperCase();

  const gatesOpen = new Date(concert.gatesOpenTime).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).toUpperCase();

  const languagesDisplay = concert.languages ? `Event  will be in ${concert.languages.split(",").join(" & ")}` : "";
  return (
    <SafeAreaView className='flex-1 bg-black'>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Image
          source={{ uri: concert.imageUrl }}
          className='w-full h-[450px] rounded-none '
          onLoad={() => console.log('Image loaded successfully')}
          onError={(error) => console.log('Image load error:', error)}
        />

        <View className='px-5 py-4'>
          <View className='flex-row gap-3 mb-2'>
            <Text className='text-gray-400 text-sm'>Music</Text>
            <Text className='text-gray-400 text-sm'>Concerts</Text>
          </View>

          <Text className='text-white text-2xl font-semibold mb-1'>{concert?.name}</Text>
          <Text className='text-gray-300 text-base mb-4'>{formattedDate}, {formattedTime}</Text>

          <View className='flex-row items-center mb-3'>
            <Ionicons name='location-outline' size={18} color={"#aaa"} />
            <Text className='text-gray-300 ml-2'>{concert?.venue}</Text>
            <Text className='text-gray-500 ml-auto'>35 km away</Text>
          </View>

          <View className='flex-row items-center mb-6'>
            <Ionicons name='calendar-outline' size={18} color={"#aaa"} />
            <Text className='text-gray-300 ml-2'>Gates Open at {gatesOpen} . View Schedule</Text>
          </View>

          <View className='bg-[#111] border border-gray-800 rounded-2xl p-4 mb-6'>
            <Text className='text-yellow-500 font-semibold mb-2'>Why this events stands out</Text>
            <Text className='text-gray-300 text-sm leading-5'>{concert?.about || "An amazing concert with top artists"}</Text>
          </View>

          <Text className='text-gray-200 text-lg font-semibold mb-3'>Who is taking the stage</Text>

          <View className='bg-[#111] border border-gray-800 rounded-2xl p-4 mb-6'>
            <View className='flex-row items-center mb-3'>
              <Image source={{ uri: "https://media.istockphoto.com/id/1072414484/photo/singer-singing-silhouette.jpg?s=1024x1024&w=is&k=20&c=wiWrgRoj_RkaKDEfIJDlg2nk9DDhGxG-5Ym47ve4t3U=" }}
                className='w-14 h-14 rounded-full mr-4'
              />
              <View>
                <Text className='text-white font-semibold'>Anirudh Ravichandar</Text>
                <Text className='text-gray-400 text-sm'>Rockstar Indian, Music</Text>
              </View>


            </View>

            <View className='space-y-3'>
              {["Hukum", "PowerHouse", "Chaleya", "Monica"].map((song, index) => (
                <View
                  className='flex-row justify-between items-center bg-[#1a1a1a] px-4 py-3 rounded-xl'
                  key={index}>
                  <Text className='text-gray-300 text-sm'>{index + 1}. {song}</Text>
                  <Ionicons name='play-circle-outline' size={22} color={"#fff"} />
                </View>
              ))}
            </View>
          </View>

          <Text className='text-gray-200 text-lg font-semibold mb-3'>About the Event</Text>
          <Text className='text-gray-400 text-sm leading-5 mb-6'>{concert?.about}</Text>

          <Text className="text-gray-200 text-lg font-semibold mb-3">
            Things to Know
          </Text>
          <View className="space-y-3 mb-10">
            <Text className="text-gray-400 mb-2">{languagesDisplay}</Text>
            <Text className="text-gray-400 mb-2">
              Ticket needed for ages 5 and above
            </Text>
            <Text className="text-gray-400 mb-2">
              Entry allowed for ages 5 and above
              I
            </Text>
            <Text className="text-gray-400"> Free parking available</Text>
          </View>


          <Text className='text-gray-300 text-lg font-semibold mb-3'>Organized By</Text>
          <View className='bg-[#111] border border-gray-800 rounded-2xl p-4 flex-row items-center justify-between mb-8'>
            <View className='flex-row items-center'>
              <View className='w-12 h-12 rounded-full bg-purple-600 justify-center items-center mr-3'>
                <Ionicons name='person' size={24} color={"white"} />
              </View>
              <View>
                <Text className='text-white font-semibold'>{concert?.organizedBy}</Text>
                <Text className='text-gray-400 text-xs mt-1'>Hosted events . 3.2 years hosting</Text>
              </View>
            </View>
          </View>

        </View>

        
      </ScrollView>


      <View className='absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 flex-row items-center justify-between'>
          <Text className='text-white text-lg font-semibold'>{minprice} onwards</Text>
          <TouchableOpacity
          onPress={() => router.push('/book')}

          className='bg-white px-6 py-3 rounded-full'>
          <Text className='text-black font-semibold'>Book Tickets</Text>
          </TouchableOpacity>
        </View>

    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});

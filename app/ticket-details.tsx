import { getUserBookings } from "@/api/bookingApi";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

// Booking information
interface Booking {
  id: string;
  seats: number;
  concertId: string;
  category: {
    id: string;
    name: string;
    price: number;
  };
  concert: {
    id: string;
    name: string;
    venue: string;
    date: string;
    imageUrl: string;
    gatesOpenTime?: string; 
  };
}

interface Ticket {
  bookingId: string;
  ticketIndex: number;
  seats:number,
  category:Booking["category"];
  concert:Booking["concert"];
}

export default function TicketDetailScreen () {
  const router = useRouter();
  const {concertId} = useLocalSearchParams<{concertId:string}>();
  if(!concertId){
    return(
      <SafeAreaView className="flex-1 bg-black justify-center items-center">
        <Text>Invalid ticket details</Text>
      </SafeAreaView>
    )
  }

  const {
  data: rawBookings,
  isLoading,
  error,
  refetch,
} = useQuery({
  queryKey: ["userBookings"],
  queryFn: getUserBookings,
});

// Transform bookings into tickets
const tickets: Ticket[] = React.useMemo(() => {
  if (!rawBookings) return [];

  return rawBookings
    .filter((booking: Booking) => booking.concertId === concertId) // Only current concert
    .flatMap((booking: Booking) =>
      Array.from({ length: booking.seats }).map((_, index) => ({
        bookingId: booking.id,
        ticketIndex: index + 1, // ticket numbers start at 1
        seats: 1, // Each ticket represents 1 seat
        category: booking.category,
        concert: booking.concert,
      }))
    );
}, [rawBookings, concertId]);


const concert = tickets[0].concert;


// Get concert date safely from first ticket
const concertDate =
  tickets?.[0]?.concert?.date
    ? new Date(tickets[0].concert.date)
    : null;

// Calculate unlock time (4 hours before concert)
let unlockTime: Date | null = null;

if (concertDate) {
  unlockTime = new Date(concertDate);
  unlockTime.setHours(concertDate.getHours() - 4);
}

// Check if tickets are unlocked
const isUnlocked = unlockTime ? new Date() >= unlockTime : false;

// Format unlock time for display
const formattedUnlockTime = unlockTime
  ? unlockTime.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })
  : null;

  const formattedDate = new Date(concert.date).toLocaleString("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hour12: true,
});

const renderTicketCard = ({item} : {item:Ticket}) => {
  const qrValue = JSON.stringify({
    bookingId:item.bookingId,
    ticketIndex:item?.ticketIndex,
    userId:"userId",
    concertId:item.concert.id,
    categoryId:item.category.id,
  });

  return(
    <View className="bg-[#111] rounded-2xl p-4 mb-4">
  <View className="flex-row items-start mb-3">
    
    <Image
      className="w-16 h-20 rounded-lg mr-3"
      source={{ uri: item?.concert?.imageUrl }}
    />

    <View className="flex-1">
      
      <Text className="text-white font-semibold text-sm">
        {item?.concert?.name}
      </Text>

      <Text className="text-gray-400 text-xs mb-1">
        {item?.category?.name} Seat {item?.ticketIndex}
      </Text>

      <Text className="text-white text-xs">
        {item?.category?.price} • {item?.concert?.venue}
      </Text>

    </View>

  </View>
  <View className="items-center relative">
  <QRCode
    value={qrValue}
    size={200}
    color={isUnlocked ? "#000" : "#666"} // gray when locked
  />

  {!isUnlocked && (
    <View className="absolute inset-0 bg-black/50 rounded-lg items-center justify-center">
      <Ionicons name="lock-closed" size={48} color="#fff" />

      <Text className="text-white text-xs mt-2 text-center px-4">
        QR code will be unlocked on {formattedUnlockTime}
      </Text>
    </View>
  )}
</View>

<Text className="text-gray-400 text-xs mt-3 text-center">
  M-Ticket: Show the QR at the gate for entry
</Text>

</View>

  )
}


  return(
    <SafeAreaView className="flex-1 bg-black">
      
      <View className="px-4 pt-4 pb-2">
        
        <Pressable
          onPress={() => router.back()}
          className="flex-row items-center mb-2"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text className="text-white text-xl font-bold ml-2">Back</Text>
        </Pressable>

        <Text className="text-white text-xl font-bold">
          Your Tickets
        </Text>

      </View>


      <View className="px-4 mb-4">
  <Image
    resizeMode="cover"
    className="w-full h-32 rounded-xl"
    source={{ uri: concert.imageUrl }}
  />

  <Text className="text-white font-semibold text-lg mt-3">
    {concert?.name}
  </Text>

  <Text className="text-gray-400 text-sm">
    {formattedDate}
  </Text>

  <Text className="text-white text-sm mt-1">
    {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
  </Text>

  <View className="flex-row items-center mt-2">
    <View className="w-2 h-2 bg-gray-500 rounded-full mr-2" />
    <Text className="text-gray-400 text-sm flex-1">
      {concert.venue}
    </Text>
  </View>
</View>

<FlatList
  data={tickets}
  renderItem={renderTicketCard}
  keyExtractor={(item) => `${item.bookingId}-${item.ticketIndex}`}
  contentContainerStyle={{ padding: 16 }}
  showsVerticalScrollIndicator={false}
  ListFooterComponent={
    <Text className="text-white text-base font-semibold mb-3">
      Tickets
    </Text>
  }
/>

    </SafeAreaView>
  )
}

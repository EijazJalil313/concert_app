import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getUserBookings } from '@/api/bookingApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Booking {
  id: string,
  seats: string | number,
  concertId: string,
  category: {
    id: string,
    name: string,
    price: number,
  };
  concert: {
    id: string,
    name: string,
    venue: string,
    date: string,
    imageUrl: string,
  }
};


interface AggregatedBooking {
  concertId: string;
  totalSeats: number;
  categories: Array<{
    id: string;
    name: string;
    price: number;
    seats: number;
  }>;
  concert: Booking["concert"];
}


const event = () => {
  const router = useRouter();

  const { data: rawBookings, isLoading, error, refetch } = useQuery({
    queryKey: ["userBookings"],
    queryFn: getUserBookings
  });

  const bookings: AggregatedBooking[] = React.useMemo(() => {
    if (!rawBookings) return [];

    const reduced = rawBookings.reduce(
      (acc: { [key: string]: AggregatedBooking }, booking: Booking) => {
        const concertId = booking.concertId;
        const seatsNum = Number(booking.seats) || 0;

        if (!acc[concertId]) {
          acc[concertId] = {
            concertId,
            totalSeats: seatsNum,
            categories: [
              {
                ...booking.category,
                seats: seatsNum,
              },
            ],
            concert: booking.concert,
          };
        } else {
          acc[concertId].totalSeats += seatsNum;

          acc[concertId].categories.push({
            ...booking.category,
            seats: seatsNum,
          });
        }

        return acc;
      },
      {}
    );

    return Object.values(reduced);
  }, [rawBookings]);

  const renderBookingCard = ({ item }: { item: AggregatedBooking }) => {
    const formattedDate = new Date(item.concert?.date).toLocaleDateString(
      "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }
    );

    return (
      <Pressable className='bg-[#111] rounded-2xl p-4 mb-4'>
        <View className="flex-row">
          <Image
            className="w-20 h-24 rounded-xl mr-4"
            source={{ uri: item?.concert?.imageUrl }}
          />

          <View className="flex-1">
            <Text className="text-white font-semibold text-base mb-1">
              {item?.concert?.name}
            </Text>

            <Text className="text-gray-400 text-sm mb-1">
              {formattedDate}
            </Text>

            <Text className="text-white text-sm mb-2">
              {item.totalSeats} ticket{item.totalSeats === 1 ? "" : "s"}
            </Text>

            <View className="flex-row items-center mb-2">
              <View className="w-2 h-2 bg-gray-500 rounded-full mr-2" />

              <Text className="text-gray-400 text-sm flex-1">
                {item?.concert?.venue}
              </Text>
            </View>
            <View className='flex-row justify-between items-center'>
              <View className="bg-green-600 px-3 py-1 rounded-full">
                <Text className="text-green-100 text-xs font-medium">
                  Booked
                </Text>
                
              </View>
<Pressable
              className="flex-row items-center"
              onPress={() =>
                router.push({
                  pathname: "/ticket-details",
                  params: { concertId: item.concertId },
                })
              }
            >
              <Text className="text-blue-400 text-sm font-medium mr-1">
                View details
              </Text>

              <Ionicons name="chevron-forward" size={16} color="#60a5fa" />
            </Pressable>
            </View>
            


          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-black'>
      <View className='px-4 pt-4 pb-2'>
        <Text className='text-white text-xl font-bold'>Event Tickets</Text>

        <FlatList
          data={bookings}
          renderItem={renderBookingCard}
          keyExtractor={(item) => item.concertId}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-20">
              <Ionicons name="ticket-outline" size={64} color="#666" />

              <Text className="text-gray-400 text-lg mt-4 text-center">
                No tickets booked
              </Text>

              <Text className="text-gray-500 text-sm mt-2 text-center">
                Book your first event to see it over here
              </Text>

              <Pressable
                onPress={() => router.push("/book")}
                className="mt-6 bg-blue-600 px-8 py-3 rounded-full"
              >
                <Text className="text-white font-semibold">Book Now</Text>
              </Pressable>
            </View>
          }
        />

      </View>
    </SafeAreaView>
  )
}

export default event

const styles = StyleSheet.create({})
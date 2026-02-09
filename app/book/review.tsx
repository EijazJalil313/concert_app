import { confirmBooking, createBooking, getPendingBooking } from '@/api/bookingApi';
import { getConcert } from '@/api/concertApi';
import { useBookingStore } from '@/stores/bookingStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


interface Booking {
  id: string;
  expiresAt: Date;
  seats: number;
  category: {
    id: string;
    name: string;
    price: number;
  };
}

interface QueueStatus {
  position: number;
  status: string;
  timeSlot?: Date;
  highDemand?: boolean;
}


export default function ReviewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [queueStatus, setQueryStatus] = useState<QueueStatus | null>(null);
  const hasInitializedTimer = useRef(false);



  const { data: concert, isLoading: concertLoading } = useQuery({
    queryKey: ["concert"],
    queryFn: getConcert,
  });

  const tickets = useBookingStore((s) => s.tickets);
  const removeTicket = useBookingStore((s) => s.removeTicket);
  const getTotal = useBookingStore((s) => s.getTotal);
  const clearCart = useBookingStore((s) => s.clearCart);

  const categoryId = tickets[0]?.sectionId;

  const totalSeats = tickets.reduce((sum, t) => sum + t.quantity, 0);

  const { data: pendingBooking, isLoading: pendingLoading } = useQuery({
    queryKey: ["pendingBooking", categoryId],
    queryFn: () => getPendingBooking(categoryId as string),
    enabled: !!categoryId,
  });


  const createMutation = useMutation({
    mutationFn: (data) => createBooking(data),
    onSuccess: (data: Booking) => {
      console.log("Booking Created, expires", data.expiresAt);
      setBooking(data);
      setExpiresAt(new Date(data.expiresAt));
      queryClient.invalidateQueries({
        queryKey: ["pendingBooking", categoryId],
      });
    },
    onError: (err: any) => {
      console.error("Create booking error", err?.response?.data || err?.message);
      Alert.alert("Error", "Failed to reserve the tickets");
      router.back();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (bookingId: string) => confirmBooking(bookingId),
    onSuccess: (data, bookingId) => {
      clearCart();
      queryClient.invalidateQueries({
        queryKey: ["pendingBooking", categoryId],
      });
      router.replace(`/book/confirmation?bookingId=${bookingId}`)
    },

    onError: (err: any) => {
      Alert.alert("Error", "Failed to confirm", err?.message);
    }
  });


  useEffect(() => {
    if (!concertLoading && concert && !booking && !createMutation.isPending && !pendingLoading && categoryId) {
      console.log("Review mount: checking pending for category", categoryId, pendingBooking);

      if (pendingBooking) {
        const now = new Date().getTime();
        let diff = Math.floor(
          (new Date(pendingBooking.expiresAt).getTime() - now) / 1000
        );

        if (diff <= 0) {
          console.log("Mount: Skipping expired Pending");
          queryClient.setQueryData(["pendingBooking", categoryId], null);
          // handleExpiry(false);
          return;
        }

        console.log("Loading existing pending for categories", pendingBooking);
        clearCart();
        useBookingStore.getState().addTicket(
          pendingBooking.category.id,
          pendingBooking.category.name,
          pendingBooking.category.price,
          pendingBooking.seats

        );
        setBooking(pendingBooking);
        setExpiresAt(new Date(pendingBooking.expiresAt));
        setQueryStatus(null);
      } else if (tickets.length > 0) {
        createMutation.mutate({ categoryId, seats: totalSeats })
      } else {
        router.back();
      }
    }
  }, [concertLoading, concert?.id, categoryId, booking, createMutation.isPending, pendingLoading, pendingBooking, totalSeats])


  if (createMutation.isPending || concertLoading || pendingLoading) {
    return (
      <SafeAreaView className='flex-1 bg-black justify-center items-center'>
        <ActivityIndicator size={"large"} color={"#fff"}></ActivityIndicator>
      </SafeAreaView>
    )
  }

  if (createMutation.isError || !concert || !categoryId) {
    return (
      <SafeAreaView className='flex-1 bg-black justify-center items-center'>
        <Text className='text-red-500'>Error:{createMutation.error?.message || "No Tickets Selected"}</Text>
        <Pressable onPress={() => router.back()}>
          <Text className='text-white'>Go Back</Text>
        </Pressable>
      </SafeAreaView>
    )
  }




  const mm = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const ss = (secondsLeft % 60).toString().padStart(2, "0");

  return (
    <SafeAreaView className='flex-1 bg-black'>
      <View className='px-4 pt-3 pb-2'>
        <View className="flex-row items-center">
          <Pressable className="p-2 rounded-full" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>

          <View className="flex-1">
            <Text className="text-white text-lg font-semibold">
              Review your booking
            </Text>
          </View>
        </View>

        <View className="px-4">
          <View className="bg-[#1a1a1a] rounded-full px-4 py-2 items-center justify-center mb-4">
            <Text className="text-gray-300">
              Complete your booking in{" "}
              <Text className="text-green-400 font-semibold">
                {mm}:{ss}
              </Text>{" "}
              mins
            </Text>
          </View>
        </View>

      </View>
    </SafeAreaView>
  )
}


const styles = StyleSheet.create({})
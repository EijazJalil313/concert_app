import { getConcert } from "@/api/concertApi";
import { useBookingStore } from "@/stores/bookingStore";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";



export default function TicketScreen() {
    const Router = useRouter();
    const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();

    const tickets = useBookingStore((s) => s.tickets);
    const addTicket = useBookingStore((s) => s.addTicket);
    const removeTicket = useBookingStore((s) => s.removeTicket);
    const updateQuantity = useBookingStore((s) => s.updateQuantity);
    const getTotal = useBookingStore((s) => s.getTotal);
    const clearCart = useBookingStore((s) => s.clearCart);
    const {
        data: concert,
        isLoading: concertLoading,
        error: concertError,
    } = useQuery({
        queryKey: ["concert"],
        queryFn: getConcert,
    });


    const formattedDate = new Date(concert.date).toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
    });

    const formattedTime = new Date(concert.date)
        .toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        })
        .toUpperCase();


    const categoryData = concert?.categories.find(
        (cat: { id: string }) => cat.id === categoryId
    );

    const { name: title, price } = categoryData;

    const myTicket = tickets?.find((t) => t.sectionId === categoryId);
    const quantity = myTicket?.quantity ?? 0;

    const totalTickets = tickets?.reduce((acc,t) => acc + t.quantity,0);
    const totalPrice = getTotal();
    const isActiveSession = false;
    const handleAdd = () => {
  if (isActiveSession) return;

  if (!myTicket) {
    addTicket(categoryId as string, title, price, 1);
  } else {
    updateQuantity(categoryId as string, myTicket.quantity + 1);
  }
};

const handleRemove = () => {
  if (isActiveSession) return;
  if (!myTicket) return;

  const newQty = myTicket.quantity - 1;

  if (newQty <= 0) {
    removeTicket(categoryId as string);
  } else {
    updateQuantity(categoryId as string, newQty);
  }
};



    if (!categoryData) {
        return (
            <SafeAreaView className="flex-1 bg-black justify-center items-center">
                <Text className="text-white">Category not found</Text>
                <Pressable onPress={() => router.back()}>
                    <Text className="text-white">Go Back</Text>
                </Pressable>
            </SafeAreaView>
        )
    }



    return <SafeAreaView className="flex-1 bg-black">
        <View className="px-4 pt-3 pb-2">
            <View className="flex-row items-center">
                <Pressable className="p-2 rounded-full" onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={"#fff"} />
                </Pressable>

                <View className="ml-3 flex-1">
                    <Text className="text-white text-lg font-semibold">{concert?.name}</Text>
                    <Text className="text-gray-400 text-sm mt-1">{formattedDate} |{formattedTime} onwards | {concert?.venue}</Text>
                </View>
            </View>
        </View>


        <ScrollView
            className="flex-1 px-4"
            contentContainerStyle={{ paddingBottom: 140 }}
        >
            <Text
                className="text-white text-xl font-bold mb-5">Choose Tickets</Text>

            <View className="bg-[#111] border border-gray-800 rounded-2xl px-4 py-5 mb-4">
                <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-white font-semibold text-base">{title.toUpperCase()}</Text>
                    {quantity == 0 ? (
                        <Pressable onPress={handleAdd} className={`w-28 py-2 border rounded-lg items-center justify-center ${isActiveSession ? "border-gray-500 bg-gray-100" : "border-gray-300 bg-gray-800"}`} >
                            <Text className={`font-medium ${isActiveSession ? "text-red-600" : "text-white"}`}>{isActiveSession ? "Session Active" : "Add Ticket"}</Text>
                        </Pressable>
                    ):(
                        <View className="w-28 py-2 rounded-lg bg-white flex-row items-center justify-between px-3">
                            <Pressable onPress={handleRemove} className={`p-1 rounded ${isActiveSession ? "opacity-50":""}`}>
                            <Text className={`text-lg font-bold ${isActiveSession ? "text-gray-400" : "text-black"}`}>-</Text>

                            </Pressable>
                            <Text className="text-black font-semibold text-base">{quantity}</Text>
                            <Pressable onPress={handleAdd}  className={`p-1 rounded ${isActiveSession ? "opacity-50":""}`}>
                            <Text  className={`text-lg font-bold ${isActiveSession ? "text-gray-400" : "text-black"}`}>+</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
                <Text className="text-gray-300 text-base mb-3">₹{price.toLocaleString()} each</Text>
                <View className="space-y-1 mt-2">
  <Text className="text-gray-400 text-sm">
    • Each ticket grants entry to one individual in the {title} zone
  </Text>

  <Text className="text-gray-400 text-sm mt-1">
    • This is a standing section.
  </Text>

  <Text className="text-gray-400 text-sm mt-1">
    • Seats will be allocated on a first-come, first-served basis.
  </Text>
</View>



            </View>

            <View className="bg-[#111] border border-gray-800 rounded-2xl px-4 py-4 mb-4">
    <Text className="text-white font-semibold mb-2">Order Summary</Text>
    <Text className="text-gray-400 text-sm">{totalTickets} ticket {totalTickets ? "s" : ""} • ₹ {totalPrice.toLocaleString()}</Text>
</View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4 flex-row items-center justify-between">
            <View>
                <Text className="text-gray-400 text-sm">{totalTickets} ticket {totalTickets ? "s" : ""} •  ₹</Text>
                <Text className="text-white text-lg font-semibold">{totalPrice.toLocaleString()}</Text>
            </View>

            <Pressable className="px-4 py-3 rounded-full bg-white">
                    <Text className="font-semibold">Continue</Text>
            </Pressable>
        </View>

    </SafeAreaView>
}
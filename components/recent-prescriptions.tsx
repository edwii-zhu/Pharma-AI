"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const recentPrescriptions = [
  {
    id: 1,
    patient: "Sarah Johnson",
    medication: "Amoxicillin 500mg",
    date: "2024-03-20",
    status: "Filled",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
  },
  {
    id: 2,
    patient: "Michael Chen",
    medication: "Lisinopril 10mg",
    date: "2024-03-20",
    status: "Pending",
    image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100"
  },
  {
    id: 3,
    patient: "Emily Davis",
    medication: "Metformin 850mg",
    date: "2024-03-19",
    status: "Ready",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100"
  }
]

export function RecentPrescriptions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Prescriptions</CardTitle>
        <CardDescription>Latest prescription activities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentPrescriptions.map((prescription) => (
            <div key={prescription.id} className="flex items-center space-x-4">
              <Avatar>
                <AvatarImage src={prescription.image} />
                <AvatarFallback>{prescription.patient[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">{prescription.patient}</p>
                <p className="text-sm text-muted-foreground">{prescription.medication}</p>
              </div>
              <div className="text-sm text-right">
                <p className="font-medium">{prescription.date}</p>
                <p className={cn(
                  "text-xs",
                  prescription.status === "Filled" && "text-green-500",
                  prescription.status === "Pending" && "text-yellow-500",
                  prescription.status === "Ready" && "text-blue-500"
                )}>{prescription.status}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
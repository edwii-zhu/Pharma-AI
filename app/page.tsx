import { MainNav } from "@/components/main-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnalyticsChart } from "@/components/analytics-chart"
import { RecentPrescriptions } from "@/components/recent-prescriptions"
import { Pill, Stethoscope, Package, Activity, DollarSign, AlertTriangle } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      
      <main className="flex-1">
        <div className="container px-4 py-6">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">
                  Welcome to your pharmacy management dashboard
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline">Export Report</Button>
                <Button>New Prescription</Button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Prescriptions
                  </CardTitle>
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,274</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Inventory Items
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">845</div>
                  <div className="flex items-center space-x-1 text-xs text-yellow-500">
                    <AlertTriangle className="h-3 w-3" />
                    <span>12 items below reorder point</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Patients
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">573</div>
                  <p className="text-xs text-muted-foreground">
                    +12 new this week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$24,389</div>
                  <p className="text-xs text-muted-foreground">
                    +15.3% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <AnalyticsChart />
              <div className="col-span-3">
                <RecentPrescriptions />
              </div>
            </div>

            <Tabs defaultValue="inventory" className="space-y-4">
              <TabsList>
                <TabsTrigger value="inventory">Inventory Alerts</TabsTrigger>
                <TabsTrigger value="prescriptions">Pending Prescriptions</TabsTrigger>
                <TabsTrigger value="interactions">Drug Interactions</TabsTrigger>
              </TabsList>

              <TabsContent value="inventory" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Low Stock Alerts</CardTitle>
                    <CardDescription>
                      Items that need immediate attention
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Amoxicillin 500mg</p>
                            <p className="text-sm text-muted-foreground">Current Stock: 15</p>
                          </div>
                          <Button variant="outline" size="sm">Reorder</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="prescriptions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pending Verifications</CardTitle>
                    <CardDescription>
                      Prescriptions awaiting pharmacist review
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">John Doe</p>
                            <p className="text-sm text-muted-foreground">Metformin 1000mg</p>
                          </div>
                          <Button size="sm">Review</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interactions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Potential Interactions</CardTitle>
                    <CardDescription>
                      AI-detected drug interaction warnings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Array.from({length: 2}).map((_, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg">
                          <div>
                            <p className="font-medium">Warfarin + Aspirin</p>
                            <p className="text-sm text-muted-foreground">Increased bleeding risk</p>
                          </div>
                          <Button variant="destructive" size="sm">Review</Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
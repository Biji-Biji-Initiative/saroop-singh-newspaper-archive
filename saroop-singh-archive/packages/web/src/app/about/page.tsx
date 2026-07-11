'use client'

import { useState } from 'react'
import { Medal, Calendar, MapPin, Users, Trophy, BookOpen, Heart, Star, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState('biography')

  const achievements = [
    {
      year: '1937',
      title: 'Half-Mile State Record',
      description: 'Set the Selangor state record for the half-mile distance',
      icon: Medal,
      color: 'text-yellow-600 bg-yellow-100'
    },
    {
      year: '1936-1940',
      title: 'Multiple Athletics Championships',
      description: 'Competed in various athletic meetings across Malaya',
      icon: Trophy,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      year: '1940',
      title: 'Cross Country Excellence',
      description: 'Member of Selangor Harriers cross-country team',
      icon: Star,
      color: 'text-green-600 bg-green-100'
    }
  ]

  const timeline = [
    { 
      period: '1930s', 
      events: [
        'Early athletic career begins',
        'Joins local athletic associations',
        'Participates in inter-state competitions'
      ]
    },
    { 
      period: '1936-1937', 
      events: [
        'Breakthrough performances in mile races',
        'Sets half-mile state record in Selangor',
        'Gains recognition in major newspapers'
      ]
    },
    { 
      period: '1938-1940', 
      events: [
        'Continues competitive athletics',
        'Active member of Selangor Harriers',
        'Competes in cross-country events'
      ]
    },
    { 
      period: '1940s-1950s', 
      events: [
        'Transitions to sports administration',
        'Contributes to Sikh community athletics',
        'Mentors younger athletes'
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-vintage-50 to-sepia-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-vintage-800 to-sepia-800 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-6xl font-bold mb-6 font-serif">
            Saroop Singh
          </h1>
          <p className="text-2xl mb-8 leading-relaxed opacity-90">
            Pioneer Sikh Athlete of Colonial Malaya
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Active 1936-1957</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              <span>Kuala Lumpur, Malaya</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="h-5 w-5" />
              <span>Middle Distance Specialist</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 mb-8">
            <TabsTrigger value="biography" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Biography
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="legacy" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Legacy
            </TabsTrigger>
            <TabsTrigger value="archive" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Archive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="biography" className="space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border-vintage-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-3xl font-serif text-vintage-800 flex items-center gap-2">
                  <Users className="h-8 w-8 text-vintage-600" />
                  The Man Behind the Records
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-vintage-700">
                <p className="text-xl leading-relaxed mb-6">
                  Saroop Singh stands as a pioneering figure in Malaysian athletics, representing the Sikh 
                  community&rsquo;s significant contributions to sports during the colonial era of Malaya.
                </p>
                
                <h3 className="text-2xl font-semibold text-vintage-800 mb-4">Early Athletic Career</h3>
                <p className="leading-relaxed mb-6">
                  Active during the 1930s and 1940s, Saroop Singh competed in various athletic competitions 
                  across the Federated Malay States. His specialty was middle-distance running, particularly 
                  the half-mile and mile events, where he demonstrated exceptional speed and endurance.
                </p>

                <h3 className="text-2xl font-semibold text-vintage-800 mb-4">Athletic Achievements</h3>
                <p className="leading-relaxed mb-6">
                  Singh&rsquo;s most notable achievement came in 1937 when he set the Selangor state record for 
                  the half-mile distance. This record-breaking performance was widely reported in newspapers 
                  across Malaya, including the Straits Times and Singapore Free Press, cementing his place 
                  in athletic history.
                </p>

                <h3 className="text-2xl font-semibold text-vintage-800 mb-4">Community Involvement</h3>
                <p className="leading-relaxed">
                  Beyond his individual achievements, Singh was actively involved in the Selangor Harriers 
                  and participated in cross-country events. He represented not only his athletic clubs but 
                  also served as an inspiration to the Sikh community, demonstrating excellence in sports 
                  during a time when such representation was particularly meaningful.
                </p>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-white/80 backdrop-blur-sm border-vintage-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-3xl font-serif text-vintage-800 flex items-center gap-2">
                  <Calendar className="h-8 w-8 text-vintage-600" />
                  Athletic Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {timeline.map((period, index) => (
                    <div key={period.period} className="relative">
                      {index < timeline.length - 1 && (
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gradient-to-b from-vintage-300 to-vintage-200"></div>
                      )}
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-vintage-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {period.period.split('-')[0].slice(-2)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-xl font-semibold text-vintage-800 mb-2">{period.period}</h4>
                          <ul className="space-y-1">
                            {period.events.map((event, eventIndex) => (
                              <li key={eventIndex} className="flex items-start gap-2 text-vintage-700">
                                <ArrowRight className="h-4 w-4 mt-0.5 text-vintage-500 flex-shrink-0" />
                                <span>{event}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement, index) => (
                <Card key={index} className="bg-white/80 backdrop-blur-sm border-vintage-200 shadow-soft hover:shadow-medium transition-all duration-300">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${achievement.color}`}>
                      <achievement.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-serif text-vintage-800">
                      {achievement.title}
                    </CardTitle>
                    <CardDescription className="text-vintage-600">
                      <Badge variant="outline" className="mb-2">
                        {achievement.year}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-vintage-700 leading-relaxed">
                      {achievement.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="bg-white/80 backdrop-blur-sm border-vintage-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-3xl font-serif text-vintage-800">
                  Competition Record
                </CardTitle>
                <CardDescription className="text-lg text-vintage-600">
                  Notable performances and competitions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xl font-semibold text-vintage-800 mb-4">Major Events</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center justify-between py-2 border-b border-vintage-100">
                        <span className="text-vintage-700">Selangor Athletic Championships</span>
                        <Badge variant="secondary">1937</Badge>
                      </li>
                      <li className="flex items-center justify-between py-2 border-b border-vintage-100">
                        <span className="text-vintage-700">FMSR Sports Meeting</span>
                        <Badge variant="secondary">1937</Badge>
                      </li>
                      <li className="flex items-center justify-between py-2 border-b border-vintage-100">
                        <span className="text-vintage-700">Cross Country Championships</span>
                        <Badge variant="secondary">1940</Badge>
                      </li>
                      <li className="flex items-center justify-between py-2 border-b border-vintage-100">
                        <span className="text-vintage-700">Inter-State Athletics</span>
                        <Badge variant="secondary">1936-1940</Badge>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-xl font-semibold text-vintage-800 mb-4">Specialty Events</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center justify-between py-2 border-b border-vintage-100">
                        <span className="text-vintage-700">Half Mile (880 yards)</span>
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">Record</Badge>
                      </li>
                      <li className="flex items-center justify-between py-2 border-b border-vintage-100">
                        <span className="text-vintage-700">One Mile</span>
                        <Badge variant="outline">Specialist</Badge>
                      </li>
                      <li className="flex items-center justify-between py-2 border-b border-vintage-100">
                        <span className="text-vintage-700">Cross Country</span>
                        <Badge variant="outline">Team Events</Badge>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="legacy" className="space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border-vintage-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-3xl font-serif text-vintage-800 flex items-center gap-2">
                  <Star className="h-8 w-8 text-vintage-600" />
                  Enduring Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-vintage-700">
                <h3 className="text-2xl font-semibold text-vintage-800 mb-4">Cultural Significance</h3>
                <p className="leading-relaxed mb-6">
                  Saroop Singh&rsquo;s achievements transcended mere athletic accomplishment. As a Sikh athlete 
                  competing in colonial Malaya, he represented his community with distinction and helped 
                  break barriers in competitive sports. His success provided inspiration and representation 
                  for the Sikh community during a formative period in Malaysian history.
                </p>

                <h3 className="text-2xl font-semibold text-vintage-800 mb-4">Athletic Legacy</h3>
                <p className="leading-relaxed mb-6">
                  His state record in the half-mile stood as a benchmark for future generations of Malaysian 
                  athletes. The detailed newspaper coverage of his achievements provides valuable insight 
                  into the athletic standards and competitive environment of 1930s and 1940s Malaya.
                </p>

                <h3 className="text-2xl font-semibold text-vintage-800 mb-4">Historical Documentation</h3>
                <p className="leading-relaxed">
                  The extensive newspaper coverage of Singh&rsquo;s career offers a unique window into the sporting 
                  culture of colonial Malaya. These historical documents preserve not only his athletic 
                  achievements but also provide context about inter-community sports, colonial society, 
                  and the development of organized athletics in the region.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-vintage-100 to-sepia-100 border-vintage-200 shadow-soft">
                <CardContent className="p-6 text-center">
                  <Medal className="h-12 w-12 text-vintage-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-vintage-800 mb-2">Athletic Pioneer</h3>
                  <p className="text-vintage-700">
                    Broke barriers as a Sikh athlete in competitive sports
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-sepia-100 to-vintage-100 border-vintage-200 shadow-soft">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-vintage-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-vintage-800 mb-2">Community Icon</h3>
                  <p className="text-vintage-700">
                    Represented and inspired the Sikh community through excellence
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-vintage-100 to-sepia-100 border-vintage-200 shadow-soft">
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-12 w-12 text-vintage-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-vintage-800 mb-2">Historical Record</h3>
                  <p className="text-vintage-700">
                    Documented achievements preserve athletic history
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="archive" className="space-y-8">
            <Card className="bg-white/80 backdrop-blur-sm border-vintage-200 shadow-soft">
              <CardHeader>
                <CardTitle className="text-3xl font-serif text-vintage-800 flex items-center gap-2">
                  <Heart className="h-8 w-8 text-vintage-600" />
                  About This Archive
                </CardTitle>
              </CardHeader>
              <CardContent className="prose prose-lg max-w-none text-vintage-700">
                <p className="text-xl leading-relaxed mb-6">
                  This digital archive preserves the legacy of Saroop Singh through a comprehensive 
                  collection of newspaper articles, photographs, and historical documents spanning 
                  his athletic career from 1936 to 1957.
                </p>

                <h3 className="text-2xl font-semibold text-vintage-800 mb-4">Collection Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-vintage-50 p-4 rounded-lg border border-vintage-200">
                    <h4 className="text-lg font-semibold text-vintage-800 mb-2">Newspaper Articles</h4>
                    <p className="text-vintage-700 mb-2">38 articles from major publications including:</p>
                    <ul className="text-sm text-vintage-600">
                      <li>• Straits Times</li>
                      <li>• Singapore Free Press</li>
                      <li>• Indian Daily Mail</li>
                      <li>• Malaya Tribune</li>
                    </ul>
                  </div>
                  
                  <div className="bg-sepia-50 p-4 rounded-lg border border-vintage-200">
                    <h4 className="text-lg font-semibold text-vintage-800 mb-2">Time Period</h4>
                    <p className="text-vintage-700 mb-2">Documents spanning:</p>
                    <ul className="text-sm text-vintage-600">
                      <li>• 1936-1940: Peak athletic years</li>
                      <li>• 1949-1957: Later career & community involvement</li>
                      <li>• Undated historical documents</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-semibold text-vintage-800 mb-4">Research & Preservation</h3>
                <p className="leading-relaxed mb-6">
                  Each document has been carefully digitized, transcribed, and cataloged to ensure 
                  accessibility and preservation. The archive includes both original newspaper clippings 
                  and detailed transcriptions to make the historical content searchable and readable.
                </p>

                <h3 className="text-2xl font-semibold text-vintage-800 mb-4">Educational Purpose</h3>
                <p className="leading-relaxed">
                  This archive serves researchers, historians, and community members interested in the 
                  athletic history of Malaysia, Sikh contributions to sports, and the broader cultural 
                  heritage of the region during the colonial and post-independence periods.
                </p>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-white/80 backdrop-blur-sm border-vintage-200 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-vintage-800">
                    Explore the Collection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button asChild className="w-full bg-vintage-600 hover:bg-vintage-700">
                    <Link href="/articles">
                      Browse All Articles
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full border-vintage-300 text-vintage-700 hover:bg-vintage-50">
                    <Link href="/timeline">
                      View Timeline
                      <Calendar className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full border-vintage-300 text-vintage-700 hover:bg-vintage-50">
                    <Link href="/gallery">
                      Image Gallery
                      <Medal className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-vintage-200 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-2xl font-serif text-vintage-800">
                    Contact & Contributions
                  </CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none text-vintage-700">
                  <p className="mb-4">
                    If you have additional materials, corrections, or would like to contribute to 
                    this archive, please get in touch.
                  </p>
                  <div className="space-y-2">
                    <p><strong>Research Inquiries:</strong> Welcome for academic purposes</p>
                    <p><strong>Historical Corrections:</strong> Help us improve accuracy</p>
                    <p><strong>Additional Materials:</strong> Photos, documents, memories</p>
                  </div>
                  <p className="text-sm text-vintage-600 mt-4">
                    This archive is maintained as a historical resource for educational and research purposes.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

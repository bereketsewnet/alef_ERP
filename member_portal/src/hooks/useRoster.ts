import { useQuery } from '@tanstack/react-query'
import { rosterApi } from '@/api/endpoints/roster'
import { cacheRoster, getCachedRoster } from '@/utils/storage'
import { useMemo } from 'react'
import { isToday, isTomorrow, isAfter, startOfDay } from 'date-fns'
import type { ShiftSchedule } from '@/types'

export function useRoster() {
    const query = useQuery({
        queryKey: ['roster', 'my-roster'],
        queryFn: async () => {
            const data = await rosterApi.getMyRoster()
            // Cache for offline use
            await cacheRoster(data)
            return data
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // If offline or error, try to use cached data
    const { data, isError } = query

    const shifts = useMemo(() => {
        if (Array.isArray(data)) return data

        // Fallback to cached data
        getCachedRoster().then((cached) => {
            if (cached && Array.isArray(cached)) {
                return cached
            }
        })
        return []
    }, [data])

    const todayShift = useMemo(() => {
        return shifts.find((shift: ShiftSchedule) => isToday(new Date(shift.shift_start)))
    }, [shifts])

    const tomorrowShift = useMemo(() => {
        return shifts.find((shift: ShiftSchedule) => isTomorrow(new Date(shift.shift_start)))
    }, [shifts])

    const upcomingShifts = useMemo(() => {
        const today = startOfDay(new Date())
        return shifts
            .filter((shift: ShiftSchedule) => isAfter(new Date(shift.shift_start), today))
            .sort((a: ShiftSchedule, b: ShiftSchedule) =>
                new Date(a.shift_start).getTime() - new Date(b.shift_start).getTime()
            )
            .slice(0, 7)
    }, [shifts])

    return {
        ...query,
        shifts,
        todayShift,
        tomorrowShift,
        upcomingShifts,
        isOffline: isError,
    }
}

const getAvailabilityResponse = (dimensionIds: string[], slots: any[]): any[] => {
  return dimensionIds.map((dimensionId) => {
    return {
      startDateTime: '2022-01-01T00:00:00.000Z',
      endDateTime: '2022-01-10T00:00:00.000Z',
      dimensionId: dimensionId,
      timeSlots: slots
    }
  })
}

const getAvailabilitySlot = (startDay: number, startHour: number, endDay: number, endHour: number, type: string): any => {
  return {
    dataObject: {
      slotType: type
    },
    startTime: `2022-01-${startDay < 10 ? `0${startDay}` : startDay}T${startHour < 10 ? `0${startHour}` : startHour}:00:00.000Z`,
    endTime: `2022-01-${endDay < 10 ? `0${endDay}` : endDay}T${endHour < 10 ? `0${endHour}` : endHour}:00:00.000Z`
  }
}

const getServiceResponse = (dimensionIds: string[], serviceIds: string[], slots: any[]): any[] => {
  return dimensionIds.map((dimensionId) => {
    return {
      startDateTime: '2022-01-01T00:00:00.000Z',
      endDateTime: '2022-01-10T00:00:00.000Z',
      dimensionId: dimensionId,
      services: serviceIds.map(serviceId => ({
        service: { Id: serviceId },
        timeSlots: slots
      }))
    }
  })
}

const getServiceSlot = (startDay: number, startHour: number, endDay: number, endHour: number, type: string, quantity: number): any => {
  return {
    dataObject: {
      slotType: type,
      quantity: quantity
    },
    startTime: `2022-01-${startDay < 10 ? `0${startDay}` : startDay}T${startHour < 10 ? `0${startHour}` : startHour}:00:00.000Z`,
    endTime: `2022-01-${endDay < 10 ? `0${endDay}` : endDay}T${endHour < 10 ? `0${endHour}` : endHour}:00:00.000Z`
  }
}

export {
  getAvailabilityResponse,
  getAvailabilitySlot,
  getServiceResponse,
  getServiceSlot
}

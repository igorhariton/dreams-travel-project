using TravelBackend.DataAccess.Context;
using TravelBackend.Domain.Entities.Booking;
using TravelBackend.Domain.Models.Booking;
using TravelBackend.Domain.Models.Responces;

namespace TravelBackend.BusinessLayer.Core
{
    public class BookingActions
    {
        protected BookingActions()
        {
        }

        protected List<BookingDto> GetAllBookingsActionExecution()
        {
            var data = new List<BookingDto>();
            List<BookingData> bookingData;

            using (var db = new TravelContext())
            {
                bookingData = db.Bookings.Where(x => !x.IsDeleted).ToList();
            }

            if (bookingData.Count <= 0) return data;
            foreach (var item in bookingData)
            {
                data.Add(new BookingDto
                {
                    Id = item.Id,
                    UserId = item.UserId,
                    ListingType = item.ListingType,
                    ListingId = item.ListingId,
                    CheckIn = item.CheckIn,
                    CheckOut = item.CheckOut,
                    Guests = item.Guests,
                    TotalPrice = item.TotalPrice,
                    Status = item.Status
                });
            }

            return data;
        }

        protected BookingDto? GetBookingByIdActionExecution(int id)
        {
            BookingData? bookingData;
            using (var db = new TravelContext())
            {
                bookingData = db.Bookings.FirstOrDefault(x =>
                    x.Id == id && !x.IsDeleted);
            }

            if (bookingData == null) return null;
            return new BookingDto
            {
                Id = bookingData.Id,
                UserId = bookingData.UserId,
                ListingType = bookingData.ListingType,
                ListingId = bookingData.ListingId,
                CheckIn = bookingData.CheckIn,
                CheckOut = bookingData.CheckOut,
                Guests = bookingData.Guests,
                TotalPrice = bookingData.TotalPrice,
                Status = bookingData.Status
            };
        }

        protected ActionResponce CreateBookingActionExecution(BookingDto data)
        {
            if (data.CheckOut <= data.CheckIn)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Check-out date must be after check-in date."
                };
            }

            using (var db = new TravelContext())
            {
                var bookingData = new BookingData
                {
                    UserId = data.UserId,
                    ListingType = data.ListingType,
                    ListingId = data.ListingId,
                    CheckIn = data.CheckIn,
                    CheckOut = data.CheckOut,
                    Guests = data.Guests,
                    TotalPrice = data.TotalPrice,
                    Status = data.Status == 0 ? BookingStatus.Pending : data.Status,
                    CreatedAt = DateTime.Now
                };
                db.Bookings.Add(bookingData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Booking created successfully."
            };
        }

        protected ActionResponce UpdateBookingActionExecution(BookingDto data)
        {
            var localData = GetBookingByIdInternal(data.Id);
            if (localData == null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Booking not found."
                };
            }

            localData.UserId = data.UserId;
            localData.ListingType = data.ListingType;
            localData.ListingId = data.ListingId;
            localData.CheckIn = data.CheckIn;
            localData.CheckOut = data.CheckOut;
            localData.Guests = data.Guests;
            localData.TotalPrice = data.TotalPrice;
            localData.Status = data.Status;
            localData.UpdatedAt = DateTime.Now;

            using (var db = new TravelContext())
            {
                db.Bookings.Update(localData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Booking updated successfully."
            };
        }

        protected ActionResponce DeleteBookingActionExecution(int id)
        {
            var localData = GetBookingByIdInternal(id);
            if (localData == null)
            {
                return new ActionResponce
                {
                    IsSuccess = false,
                    Message = "Booking not found."
                };
            }

            localData.IsDeleted = true;

            using (var db = new TravelContext())
            {
                db.Bookings.Update(localData);
                db.SaveChanges();
            }

            return new ActionResponce
            {
                IsSuccess = true,
                Message = "Booking deleted."
            };
        }

        private BookingData? GetBookingByIdInternal(int id)
        {
            BookingData? localData;
            using (var db = new TravelContext())
            {
                localData = db.Bookings.FirstOrDefault(x => x.Id == id);
            }

            return localData;
        }
    }
}

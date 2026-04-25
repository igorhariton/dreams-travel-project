using Microsoft.AspNetCore.Mvc;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.Booking;

namespace TravelBackend.Api.Controller
{
    [Route("api/booking")]
    [ApiController]
    public class BookingController : ControllerBase
    {
        private IBookingAction _booking;

        public BookingController()
        {
            var bl = new BusinessLayer.BusinessLogic();
            _booking = bl.BookingAction();
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var bookings = _booking.GetAllBookingsAction();
            return Ok(bookings);
        }

        [HttpGet]
        public IActionResult Get(int id)
        {
            var booking = _booking.GetBookingByIdAction(id);
            return Ok(booking);
        }

        [HttpPost]
        public IActionResult Create([FromBody] BookingDto data)
        {
            var responce = _booking.CreateBookingAction(data);
            return Ok(responce);
        }

        [HttpPut]
        public IActionResult Update([FromBody] BookingDto data)
        {
            var responce = _booking.UpdateBookingAction(data);
            return Ok(responce);
        }

        [HttpDelete]
        public IActionResult Delete(int id)
        {
            var responce = _booking.DeleteBookingAction(id);
            return Ok(responce);
        }
    }
}

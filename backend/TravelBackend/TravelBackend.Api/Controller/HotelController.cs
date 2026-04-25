using Microsoft.AspNetCore.Mvc;
using TravelBackend.BusinessLayer.Interfaces;
using TravelBackend.Domain.Models.Hotel;

namespace TravelBackend.Api.Controller
{
    [Route("api/hotel")]
    [ApiController]
    public class HotelController : ControllerBase
    {
        private IHotelAction _hotel;

        public HotelController()
        {
            var bl = new BusinessLayer.BusinessLogic();
            _hotel = bl.HotelAction();
        }

        [HttpGet("getAll")]
        public IActionResult GetAll()
        {
            var hotels = _hotel.GetAllHotelsAction();
            return Ok(hotels);
        }

        [HttpGet]
        public IActionResult Get(int id)
        {
            var hotel = _hotel.GetHotelByIdAction(id);
            return Ok(hotel);
        }

        [HttpPost]
        public IActionResult Create([FromBody] HotelDto data)
        {
            var responce = _hotel.CreateHotelAction(data);
            return Ok(responce);
        }

        [HttpPut]
        public IActionResult Update([FromBody] HotelDto data)
        {
            var responce = _hotel.UpdateHotelAction(data);
            return Ok(responce);
        }

        [HttpDelete]
        public IActionResult Delete(int id)
        {
            var responce = _hotel.DeleteHotelAction(id);
            return Ok(responce);
        }
    }
}
